const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const authorizMiddleware = require("../middlewares/authorize");
const MeterReading = require("../models/meterReading");
const Subscriber = require("../models/Subscriber");
const Meter = require("../models/Meter");
const path = require("path");
// GET /collector/api/my-subscribers
router.get('/api/my-subscribers', authMiddleware, async (req, res) => {
  try {
    console.log('Collector ID:', req.user._id);
    console.log('Company ID:', req.user.company);

    const subscribersRaw = await Subscriber.find({
      assignedCollector: req.user._id,
      company: req.user.company,
      isActive: true
    })
    .populate('meterId') // Populate meter to get serialNumber
    .sort({ fullName: 1 })
    .lean();

    const subscribers = await Promise.all(subscribersRaw.map(async (sub) => {
      // Get last 3 readings for this subscriber
      const readings = await MeterReading.find({ subscriber: sub._id })
        .sort({ readingDate: -1 })
        .limit(3)
        .lean();
      
      const lastReading = readings[0] ? readings[0].readingValue : 0;
      
      // Calculate avg consumption (diff between readings)
      let avgConsumption = 0;
      if (readings.length >= 2) {
        let totalDiff = 0;
        for (let i = 0; i < readings.length - 1; i++) {
          totalDiff += (readings[i].readingValue - readings[i+1].readingValue);
        }
        avgConsumption = totalDiff / (readings.length - 1);
      }

      return {
        ...sub,
        meterSerialNumber: sub.meterId?.serialNumber || '-',
        lastReadingValue: lastReading,
        avgConsumption: Math.max(0, avgConsumption)
      };
    }));

    console.log(`📡 Fetching subscribers with history for Collector: ${req.user._id}`);
    res.json(subscribers);
  } catch (err) {
    console.error('API ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});




// صفحة المشتركين أوفلاين
router.get('/my-subscribers', (req, res) => {
    console.log("User:", req.user); // للتأكد
  res.render('dashboard/collector/my-subscribers', {
    title: 'مشتركي'
  });
});

// صفحة تسجيل قراءة جديدة
router.get('/readings/new', authMiddleware, (req, res) => {
  res.render('dashboard/collector/new-reading', {
    title: 'تسجيل قراءة',
    user: req.user
  });
});

// صفحة الفواتير الخاصة بالمحصل
router.get('/my-invoices', authMiddleware, (req, res) => {
  res.render('dashboard/collector/my-invoices', {
    title: 'فواتيري',
    user: req.user
  });
});

// صفحة صندوق المحصل
router.get('/my-fund', authMiddleware, (req, res) => {
  res.render('dashboard/collector/my-fund', {
    title: 'صندوقي',
    user: req.user
  });
});

// صفحة مزامنة
router.get('/sync', authMiddleware, (req, res) => {
  res.render('dashboard/collector/sync', {
    title: 'مزامنة البيانات',
    user: req.user
  });
});

const { saveBase64Image } = require("../utils/imageHandler");

// POST /collector/sync
router.post('/sync', authMiddleware, async (req, res) => {
  const readings = req.body; // array of readings from Dexie
  console.log('📥 SYNC REQUEST RECEIVED');
  console.log(`📊 Payload size: ${readings.length} items`);

  if (!Array.isArray(readings) || readings.length === 0) {
    console.warn('⚠️ Sync request empty or invalid format');
    return res.status(400).json({ error: 'No readings provided' });
  }

  try {
    const results = {
      success: 0,
      duplicates: 0,
      errors: 0,
      details: []
    };
    
    for (const r of readings) {
      console.log(`🔄 Processing reading for Subscriber: ${r.subscriberId}`);
      try {
        // 1. Basic duplicate prevention: 
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const existing = await MeterReading.findOne({
          subscriber: r.subscriberId,
          readingDate: { $gte: startOfDay }
        });

        if (existing) {
          console.log(`⚠️ Duplicate found for subscriber ${r.subscriberId} today.`);
          results.duplicates++;
          results.details.push({ id: r.id, status: 'duplicate' });
          continue;
        }

        // 2. Get previous reading and calculate consumption
        let previousValue = 0;
        const lastReading = await MeterReading.findOne({
          subscriber: r.subscriberId,
          company: r.companyId || req.user.company,
          status: 'INVOICED'
        }).sort({ readingDate: -1 });

        if (lastReading) {
          previousValue = lastReading.readingValue;
        } else {
          // If no previous invoiced reading, use the meter's initial reading
          const Meter = require("../models/Meter");
          const meter = await Meter.findOne({ subscriberId: r.subscriberId });
          if (meter) {
            previousValue = meter.initialReading || 0;
          }
        }

        const consumption = r.readingValue - previousValue;

        // 3. Calculate 3-month average (approx 90 days)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
        
        const historyReadings = await MeterReading.find({
            subscriber: r.subscriberId,
            status: 'INVOICED',
            readingDate: { $gte: threeMonthsAgo }
        });

        let avgConsumption = 0;
        if (historyReadings.length > 0) {
            avgConsumption = historyReadings.reduce((sum, h) => sum + h.consumption, 0) / historyReadings.length;
        }

        // 4. Process Image if exists
        let finalImagePath = null;
        if (r.readingImage) {
          console.log('🖼️ Processing image...');
          finalImagePath = saveBase64Image(r.readingImage, 'readings');
        }

        // 5. Save to DB
        const newReading = new MeterReading({
          company: r.companyId || req.user.company,
          subscriber: r.subscriberId,
          collector: req.user._id,
          readingValue: r.readingValue,
          previousReading: previousValue,
          consumption: consumption,
          previousReadingsAvg: avgConsumption,
          readingImage: finalImagePath,
          readingDate: r.readingDate || new Date(),
          source: 'OFFLINE',
          isSynced: true,
          status: 'NEW'
        });

        const saved = await newReading.save();
        console.log(`✅ Saved reading ID: ${saved._id}`);
        
        results.success++;
        results.details.push({ id: r.id, status: 'success', serverId: saved._id });
      } catch (err) {
        console.error(`❌ Error processing reading ${r.subscriberId}:`, err);
        results.errors++;
        results.details.push({ id: r.id, status: 'error', error: err.message });
      }
    }

    console.log('📤 Sync completed. Results:', results);
    res.json(results);
  } catch (err) {
    console.error('🔥 CRITICAL SYNC ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;