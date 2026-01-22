┌─────────────┐          1       *          ┌──────────────┐
│   Company   │────────────────────────────>│   Subscriber │
│─────────────│                            │──────────────│
│ _id         │                            │ _id          │
│ name        │                            │ fullName     │
│ ownerName   │                            │ phone        │
│ phone       │                            │ nationalId   │
│ email       │                            │ address      │
│ planId      │─────────────┐              │ companyId    │
│ subscriptionStart│        │              │ primaryArea  │
│ subscriptionEnd  │        │              │ secondaryArea│
│ status          │        │              │ meterId      │
│ createdBy (User)│        │              │ assignedCollector (User) │
└─────────────┘        │              └──────────────┘
                        │
                        │
                        │
                        │
                        ▼
                 ┌─────────────┐
                 │    Plan     │
                 │─────────────│
                 │ _id         │
                 │ name        │
                 │ maxSubscribers │
                 │ priceMonthly │
                 │ features     │
                 │ isActive     │
                 └─────────────┘


┌─────────────┐          1       *          ┌─────────────┐
│    User     │────────────────────────────>│  Transaction│
│─────────────│                            │─────────────│
│ _id         │                            │ _id         │
│ fullName    │                            │ sourceFund  │
│ email       │                            │ destinationFund │
│ phone       │                            │ amount      │
│ password    │                            │ type       │
│ role        │                            │ description│
│ companyId   │─────────────┐              │ performedBy (User) │
│ subscriberId│             │              │ referenceId │
└─────────────┘             │              │ metadata   │
                            │              └─────────────┘
                            │
                            │ 1
                            ▼
                       ┌─────────────┐
                       │    Fund     │
                       │─────────────│
                       │ _id         │
                       │ name        │
                       │ type        │
                       │ owner (User)│
                       │ balance     │
                       │ currency    │
                       │ isActive    │
                       └─────────────┘


┌─────────────┐          1       *          ┌─────────────┐
│   Meter     │────────────────────────────>│  Reading    │
│─────────────│                            │─────────────│
│ _id         │                            │ _id         │
│ serialNumber│                            │ meterId     │
│ subscriberId│                            │ collectorId │
│ installationDate │                        │ previousReading │
│ status      │                            │ currentReading  │
└─────────────┘                            │ readingDate     │
                                           │ synced         │
                                           └─────────────┘


┌─────────────┐          1       *          ┌─────────────┐
│ Subscriber  │────────────────────────────>│  Invoice    │
│─────────────│                            │─────────────│
│ _id         │                            │ _id         │
│ companyId   │                            │ subscriberId│
│ fullName    │                            │ readingId   │
│ ...         │                            │ issueDate   │
└─────────────┘                            │ dueDate     │
                                           │ consumption │
                                           │ unitPrice   │
                                           │ totalAmount │
                                           │ paidAmount  │
                                           │ remainingAmount │
                                           │ paymentMethod │
                                           │ paymentProof  │
                                           │ status        │
                                           └─────────────┘


┌─────────────┐          1       *          ┌─────────────┐
│   Area      │────────────────────────────>│  Subscriber│
│─────────────│                            │─────────────│
│ _id         │                            │ primaryArea │
│ name        │                            │ secondaryArea │
│ parentArea  │
│ description │
│ isActive    │
└─────────────┘
┌─────────────┐          1       *          ┌──────────────┐
│   Company   │────────────────────────────>│   Subscriber │
│─────────────│                            │──────────────│
│ _id         │                            │ _id          │
│ name        │                            │ fullName     │
│ ownerName   │                            │ phone        │
│ phone       │                            │ nationalId   │
│ email       │                            │ address      │
│ planId      │─────────────┐              │ companyId    │
│ subscriptionStart│        │              │ primaryArea  │
│ subscriptionEnd  │        │              │ secondaryArea│
│ status          │        │              │ meterId      │
│ createdBy (User)│        │              │ assignedCollector (User) │
└─────────────┘        │              └──────────────┘
                        │
                        │
                        │
                        │
                        ▼
                 ┌─────────────┐
                 │    Plan     │
                 │─────────────│
                 │ _id         │
                 │ name        │
                 │ maxSubscribers │
                 │ priceMonthly │
                 │ features     │
                 │ isActive     │
                 └─────────────┘


┌─────────────┐          1       *          ┌─────────────┐
│    User     │────────────────────────────>│  Transaction│
│─────────────│                            │─────────────│
│ _id         │                            │ _id         │
│ fullName    │                            │ sourceFund  │
│ email       │                            │ destinationFund │
│ phone       │                            │ amount      │
│ password    │                            │ type       │
│ role        │                            │ description│
│ companyId   │─────────────┐              │ performedBy (User) │
│ subscriberId│             │              │ referenceId │
└─────────────┘             │              │ metadata   │
                            │              └─────────────┘
                            │
                            │ 1
                            ▼
                       ┌─────────────┐
                       │    Fund     │
                       │─────────────│
                       │ _id         │
                       │ name        │
                       │ type        │
                       │ owner (User)│
                       │ balance     │
                       │ currency    │
                       │ isActive    │
                       └─────────────┘


┌─────────────┐          1       *          ┌─────────────┐
│   Meter     │────────────────────────────>│  Reading    │
│─────────────│                            │─────────────│
│ _id         │                            │ _id         │
│ serialNumber│                            │ meterId     │
│ subscriberId│                            │ collectorId │
│ installationDate │                        │ previousReading │
│ status      │                            │ currentReading  │
└─────────────┘                            │ readingDate     │
                                           │ synced         │
                                           └─────────────┘


┌─────────────┐          1       *          ┌─────────────┐
│ Subscriber  │────────────────────────────>│  Invoice    │
│─────────────│                            │─────────────│
│ _id         │                            │ _id         │
│ companyId   │                            │ subscriberId│
│ fullName    │                            │ readingId   │
│ ...         │                            │ issueDate   │
└─────────────┘                            │ dueDate     │
                                           │ consumption │
                                           │ unitPrice   │
                                           │ totalAmount │
                                           │ paidAmount  │
                                           │ remainingAmount │
                                           │ paymentMethod │
                                           │ paymentProof  │
                                           │ status        │
                                           └─────────────┘


┌─────────────┐          1       *          ┌─────────────┐
│   Area      │────────────────────────────>│  Subscriber│
│─────────────│                            │─────────────│
│ _id         │                            │ primaryArea │
│ name        │                            │ secondaryArea │
│ parentArea  │
│ description │
│ isActive    │
└─────────────┘
