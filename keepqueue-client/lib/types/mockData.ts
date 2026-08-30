export const businesses = {
    "t9m9vlVt5z0LrAtx3dMS": {
        "availability": [
            {
                "end": {
                    "__time__": "2025-09-15T16:00:00.000Z"
                },
                "start": {
                    "__time__": "2025-09-15T08:00:00.000Z"
                }
            },
            {
                "end": {
                    "__time__": "2025-09-16T16:00:00.000Z"
                },
                "start": {
                    "__time__": "2025-09-16T08:00:00.000Z"
                }
            }
        ],
        "categories": [
            "Wellness",
            "Spa"
        ],
        "created": {
            "__time__": "2025-01-05T10:00:00.000Z"
        },
        "currency": "INS",
        "geo": {
            "lat": 40.7128,
            "lng": -74.006
        },
        "isActive": true,
        "lang": "he",
        "logoUrl": "/placeholder-logo.png",
        "name": "Alpha Spa",
        "ownerId": "74h4m4TvLic4eOCNX4NG",
        "phone": "+1-555-0101",
        "policy": {
            "cancellationWindowMin": 120,
            "lateThresholdMin": 10,
            "noShowAutoBlock": true,
            "noShowLimit": 3
        },
        "ratingAvg": 4.6,
        "ratingCount": 128,
        "timestamp": {
            "__time__": "2025-09-15T10:00:00.000Z"
        }
    },
    "S8rkKbrXciOE6C8kZ9I3": {
        "name": "Beta Cuts",
        "ownerId": "kq3b8XegNzWf8VtJE65W",
        "phone": "+1-555-0202",
        "geo": {
            "lat": 34.0522,
            "lng": -118.2437
        },
        "categories": [
            "Barbershop",
            "Hair"
        ],
        "ratingAvg": 4.3,
        "ratingCount": 86,
        "isActive": true,
        "availability": [
            {
                "end": {
                    "__time__": "2025-09-15T17:00:00.000Z"
                },
                "start": {
                    "__time__": "2025-09-15T09:00:00.000Z"
                }
            },
            {
                "end": {
                    "__time__": "2025-09-17T17:00:00.000Z"
                },
                "start": {
                    "__time__": "2025-09-17T09:00:00.000Z"
                }
            }
        ],
        "currency": "USD",
        "lang": "en",
        "logoUrl": "/placeholder-logo.png",
        "policy": {
            "cancellationWindowMin": 60,
            "lateThresholdMin": 15,
            "noShowAutoBlock": false
        },
        "created": {
            "__time__": "2025-02-10T12:00:00.000Z"
        },
        "timestamp": {
            "__time__": "2025-09-16T10:00:00.000Z"
        }
    },
    "GPajiLlPDRwWaJwNvWoz": {
        "name": "Gamma Fitness",
        "ownerId": "n4YOzryxnfkY2u3qNfuk",
        "phone": "+1-555-0303",
        "geo": {
            "lat": 51.5074,
            "lng": -0.1278
        },
        "categories": [
            "Fitness",
            "Training"
        ],
        "ratingAvg": 4.8,
        "ratingCount": 210,
        "isActive": true,
        "availability": [
            {
                "end": {
                    "__time__": "2025-09-15T20:00:00.000Z"
                },
                "start": {
                    "__time__": "2025-09-15T06:00:00.000Z"
                }
            },
            {
                "end": {
                    "__time__": "2025-09-18T20:00:00.000Z"
                },
                "start": {
                    "__time__": "2025-09-18T06:00:00.000Z"
                }
            }
        ],
        "currency": "INS",
        "lang": "he",
        "logoUrl": "/placeholder-logo.png",
        "policy": {
            "cancellationWindowMin": 180,
            "lateThresholdMin": 5,
            "noShowAutoBlock": true,
            "noShowLimit": 2
        },
        "created": {
            "__time__": "2025-03-01T09:00:00.000Z"
        },
        "timestamp": {
            "__time__": "2025-09-17T10:00:00.000Z"
        }
    }
};

export const services = {
    "s1": {
        "business": "t9m9vlVt5z0LrAtx3dMS",
        "name": "Swedish Massage",
        "durationMin": 60,
        "price": 85,
        "availability": [{ "start": { "__time__": "2025-09-15T08:00:00.000Z" }, "end": { "__time__": "2025-09-15T16:00:00.000Z" } }],
        "pricing": {
            "vatPercent": 8.5,
            "coupons": [
                {
                    "code": "WELCOME10",
                    "discountType": "PERCENT",
                    "amount": 10,
                    "validFrom": { "__time__": "2025-09-01T00:00:00.000Z" },
                    "validTo": { "__time__": "2025-12-31T23:59:59.000Z" },
                    "active": true
                }
            ]
        },
        "paddingBefore": 5,
        "paddingAfter": 5,
        "active": true,
        "order": 1,
        "created": { "__time__": "2025-09-01T09:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-15T09:00:00.000Z" }
    },
    "s2": {
        "business": "S8rkKbrXciOE6C8kZ9I3",
        "name": "Men Haircut",
        "durationMin": 30,
        "price": 25,
        "availability": [{ "start": { "__time__": "2025-09-15T09:00:00.000Z" }, "end": { "__time__": "2025-09-15T17:00:00.000Z" } }],
        "active": true,
        "order": 1,
        "created": { "__time__": "2025-08-20T10:30:00.000Z" },
        "timestamp": { "__time__": "2025-09-15T10:30:00.000Z" }
    },
    "s3": {
        "business": "GPajiLlPDRwWaJwNvWoz",
        "name": "Personal Training",
        "durationMin": 90,
        "price": 120,
        "availability": [{ "start": { "__time__": "2025-09-15T06:00:00.000Z" }, "end": { "__time__": "2025-09-15T20:00:00.000Z" } }],
        "active": true,
        "order": 2,
        "created": { "__time__": "2025-07-10T08:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-16T08:00:00.000Z" }
    },
    "s4": {
        "business": "t9m9vlVt5z0LrAtx3dMS",
        "name": "Deep Tissue Massage",
        "durationMin": 75,
        "price": 110,
        "availability": [{ "start": { "__time__": "2025-09-16T08:00:00.000Z" }, "end": { "__time__": "2025-09-16T16:00:00.000Z" } }],
        "active": true,
        "order": 2,
        "created": { "__time__": "2025-09-05T11:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-16T11:00:00.000Z" }
    }
};

export const calendar = {
    "c1": {
        "business": "t9m9vlVt5z0LrAtx3dMS",
        "user": "cust_1",
        "type": "APPOINTMENT",
        "status": "BOOKED",
        "title": "Massage with Dana",
        "start": { "__time__": "2025-09-15T10:00:00.000Z" },
        "end": { "__time__": "2025-09-15T11:00:00.000Z" },
        "service": "s1",
        "source": "web",
        "created": { "__time__": "2025-09-10T12:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-10T12:00:00.000Z" }
    },
    "c2": {
        "business": "S8rkKbrXciOE6C8kZ9I3",
        "user": "cust_2",
        "type": "APPOINTMENT",
        "status": "CONFIRMED",
        "title": "Haircut with Ben",
        "start": { "__time__": "2025-09-15T13:30:00.000Z" },
        "end": { "__time__": "2025-09-15T14:00:00.000Z" },
        "service": "s2",
        "source": "admin",
        "created": { "__time__": "2025-09-11T09:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-11T09:00:00.000Z" }
    },
    "c3": {
        "business": "GPajiLlPDRwWaJwNvWoz",
        "user": "cust_3",
        "type": "APPOINTMENT",
        "status": "DONE",
        "title": "Training with Alex",
        "start": { "__time__": "2025-09-16T07:00:00.000Z" },
        "end": { "__time__": "2025-09-16T08:30:00.000Z" },
        "service": "s3",
        "source": "web",
        "created": { "__time__": "2025-09-12T15:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-12T15:00:00.000Z" }
    },
    "c4": {
        "business": "t9m9vlVt5z0LrAtx3dMS",
        "user": "cust_4",
        "type": "VACATION",
        "status": "CONFIRMED",
        "title": "Staff Vacation",
        "start": { "__time__": "2025-09-20T00:00:00.000Z" },
        "end": { "__time__": "2025-09-22T23:59:59.000Z" },
        "source": "import",
        "created": { "__time__": "2025-09-01T00:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-01T00:00:00.000Z" }
    }
};

export const waitlist = {
    "w1": {
        "business": "t9m9vlVt5z0LrAtx3dMS",
        "user": "cust_5",
        "service": "s4",
        "preferredWindow": {
            "from": { "__time__": "2025-09-15T12:00:00.000Z" },
            "to": { "__time__": "2025-09-15T15:00:00.000Z" }
        },
        "priority": 1,
        "expiresAt": { "__time__": "2025-09-15T18:00:00.000Z" },
        "created": { "__time__": "2025-09-14T09:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-14T09:00:00.000Z" }
    },
    "w2": {
        "business": "S8rkKbrXciOE6C8kZ9I3",
        "user": "cust_6",
        "service": "s2",
        "preferredWindow": {
            "from": { "__time__": "2025-09-15T14:00:00.000Z" },
            "to": { "__time__": "2025-09-15T16:00:00.000Z" }
        },
        "priority": 2,
        "expiresAt": { "__time__": "2025-09-15T19:00:00.000Z" },
        "created": { "__time__": "2025-09-14T10:15:00.000Z" },
        "timestamp": { "__time__": "2025-09-14T10:15:00.000Z" }
    },
    "w3": {
        "business": "GPajiLlPDRwWaJwNvWoz",
        "user": "cust_7",
        "service": "s3",
        "preferredWindow": {
            "from": { "__time__": "2025-09-16T06:00:00.000Z" },
            "to": { "__time__": "2025-09-16T09:00:00.000Z" }
        },
        "expiresAt": { "__time__": "2025-09-16T12:00:00.000Z" },
        "created": { "__time__": "2025-09-15T12:30:00.000Z" },
        "timestamp": { "__time__": "2025-09-15T12:30:00.000Z" }
    }
};

export const reviews = {
    "r1": {
        "business": "t9m9vlVt5z0LrAtx3dMS",
        "user": "cust_1",
        "calendarEventId": "c1",
        "rating": 5,
        "text": "Great experience, highly recommend!",
        "flagged": false,
        "created": { "__time__": "2025-09-15T12:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-15T12:00:00.000Z" }
    },
    "r2": {
        "business": "S8rkKbrXciOE6C8kZ9I3",
        "user": "cust_2",
        "calendarEventId": "c2",
        "rating": 4,
        "text": "Good haircut, friendly staff.",
        "flagged": false,
        "created": { "__time__": "2025-09-15T15:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-15T15:00:00.000Z" }
    },
    "r3": {
        "business": "GPajiLlPDRwWaJwNvWoz",
        "user": "cust_3",
        "calendarEventId": "c3",
        "rating": 5,
        "text": "Intense session, great results!",
        "flagged": false,
        "created": { "__time__": "2025-09-16T10:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-16T10:00:00.000Z" }
    }
};

export const message_templates = {
    "mt1": {
        "business": "t9m9vlVt5z0LrAtx3dMS",
        "key": "appointment_confirmation",
        "language": "en",
        "content": "Your appointment is confirmed for {{date}} at {{time}}.",
        "name": "Appointment Confirmation",
        "description": "Sent when booking is confirmed.",
        "created": { "__time__": "2025-09-01T00:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-01T00:00:00.000Z" }
    },
    "mt2": {
        "business": "S8rkKbrXciOE6C8kZ9I3",
        "key": "reminder_24h",
        "language": "he",
        "content": "תזכורת: התור שלך בעוד 24 שעות ב-{{time}}.",
        "name": "תזכורת 24 שעות",
        "created": { "__time__": "2025-09-05T00:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-05T00:00:00.000Z" }
    },
    "mt3": {
        "business": "GPajiLlPDRwWaJwNvWoz",
        "key": "thank_you",
        "language": "en",
        "content": "Thanks for visiting! Please rate your experience.",
        "name": "Thank You",
        "created": { "__time__": "2025-09-10T00:00:00.000Z" },
        "timestamp": { "__time__": "2025-09-10T00:00:00.000Z" }
    }
};

// TODO: delete this file