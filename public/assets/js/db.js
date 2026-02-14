const db = new Dexie('CollectorAppDB');
window.db = db;

// Update version to 3 for history fields (lastReadingValue, avgConsumption)
db.version(3).stores({
  subscribers: 'id, assignedCollector, fullName, meterId, meterSerialNumber, lastReadingValue, avgConsumption',
  readings: '++id, subscriberId, readingValue, readingDate, isSynced' 
});

async function fetchAndLoadSubscribers() {
  try {
    const res = await fetch('/collector/api/my-subscribers');
    if (!res.ok) throw new Error('Fetch failed');

    const data = await res.json();

    const formatted = data.map(s => ({
      ...s,
      id: s.id || s._id // Ensure we store the Mongo ID as 'id'
    }));

    await db.subscribers.clear();
    await db.subscribers.bulkPut(formatted);
    console.log('Subscribers synced to local DB');
  } catch (error) {
    console.error('Error loading subscribers:', error);
    throw error;
  }
}

async function getSubscribersOffline(collectorId) {
  return db.subscribers.where('assignedCollector').equals(collectorId).toArray();
}

async function syncAllUnsynced() {
  if (!navigator.onLine) {
      console.log('📴 Offline: Sync skipped.');
      return { status: 'offline' };
  }

  try {
    const unsyncedReadings = await db.readings.where('isSynced').equals(0).toArray();
    if (unsyncedReadings.length === 0) return { status: 'empty' };

    console.log(`🔄 Syncing ${unsyncedReadings.length} readings...`);

    const res = await fetch('/collector/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unsyncedReadings)
    });

    if (res.ok) {
      const result = await res.json();
      console.log('✅ Server response:', result);

      // Mark success/duplicate as synced
      if (result.details && Array.isArray(result.details)) {
          const processedIds = result.details
              .filter(d => d.status === 'success' || d.status === 'duplicate')
              .map(d => d.id);
          
          await Promise.all(processedIds.map(id => db.readings.update(id, { isSynced: 1 })));
          console.log(`Updated ${processedIds.length} local records to synced.`);
      }

      return { status: 'success', result };
    } else {
      const errorText = await res.text();
      console.error('❌ Server error:', errorText);
      throw new Error(errorText);
    }
  } catch (error) {
    console.error('❌ Sync failed (Network/Server):', error);
    return { status: 'error', error };
  }
}

window.collectorDB = {
  db,
  fetchAndLoadSubscribers,
  getSubscribersOffline,
  syncAllUnsynced
};

// Auto-sync when coming back online
window.addEventListener('online', () => {
  console.log('🌐 Internet restored. Triggering auto-sync...');
  syncAllUnsynced().then(res => {
    if (res.status === 'success') {
      // Optional: use a global toast if available
      console.log('Auto-sync successful');
    }
  });
});

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('✅ SW Registered | Scope:', reg.scope);
        
        // Check for updates
        reg.update();
        
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          console.log('🔄 SW Update found');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✨ New SW installed, reloading...');
              // Auto-reload to activate new SW
              window.location.reload();
            }
          });
        });
      })
      .catch(err => console.error('❌ SW Registration Failed:', err));
  });
  
  // Listen for controller change (new SW activated)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 SW Controller changed');
  });
}
