//which sensor types generate the highest anomaly detection rates?
db.route_events.aggregate([

    /*
     * Stage 1
     * Retrieve relevant event information.
     */
    {
        $project: {
            sensor_type: 1,
            anomaly_flag: 1
        }
    },

    /*
     * Stage 2
     * Group by sensor type.
     */
    {
        $group: {

            _id: "$sensor_type",

            total_events: {
                $sum: 1
            },

            anomaly_events: {

                $sum: {

                    $cond: [

                        "$anomaly_flag",

                        1,

                        0

                    ]

                }

            }

        }
    },

    /*
     * Stage 3
     * Calculate anomaly rate.
     */
    {
        $addFields: {

            anomaly_rate: {

                $multiply: [

                    {

                        $divide: [

                            "$anomaly_events",

                            "$total_events"

                        ]

                    },

                    100

                ]

            }

        }
    },

    /*
     * Stage 4
     * Rank by anomaly rate.
     */
    {
        $sort: {

            anomaly_rate: -1,

            anomaly_events: -1

        }
    },

    /*
     * Stage 5
     * Limit output while testing.
     */
    {
        $limit: 20
    }

]);

//anomaly associated with risk or delays?
db.route_events.aggregate([

    /*
     * Stage 1
     * Keep only anomaly events.
     */
    {
        $match: {
            anomaly_flag: true
        }
    },

    /*
     * Stage 2
     * Join shipments.
     */
    {
        $lookup: {
            from: "shipments",
            localField: "shipment_id",
            foreignField: "shipment_id",
            as: "shipment"
        }
    },

    /*
     * Stage 3
     * Ignore anomaly events without matching shipments.
     */
    {
        $match: {
            "shipment.0": {
                $exists: true
            }
        }
    },

    /*
     * Stage 4
     * Flatten the shipment array.
     */
    {
        $unwind: "$shipment"
    },

    /*
     * Stage 5
     * Group by sensor type.
     */
    {
        $group: {

            _id: "$sensor_type",

            anomaly_events: {
                $sum: 1
            },

            average_shipment_delay: {
                $avg: "$shipment.delay_hours"
            },

            average_shipment_risk: {
                $avg: "$shipment.risk_score"
            },

            average_risk_delta: {
                $avg: "$risk_score_delta"
            },

            average_delay_added: {
                $avg: "$delay_added_hours"
            }

        }
    },

    /*
     * Stage 6
     * Rank sensors by operational impact.
     */
    {
        $sort: {

            average_risk_delta: -1,

            average_delay_added: -1

        }
    },

    /*
     * Stage 7
     * Limit output while testing.
     */
    {
        $limit: 20
    }

]);

db.route_events.aggregate([

    /*
     * Stage 1
     * Join shipments.
     */
    {
        $lookup: {
            from: "shipments",
            localField: "shipment_id",
            foreignField: "shipment_id",
            as: "shipment"
        }
    },

    /*
     * Stage 2
     * Ignore unmatched events.
     */
    {
        $match: {
            "shipment.0": {
                $exists: true
            }
        }
    },

    /*
     * Stage 3
     * Flatten shipment array.
     */
    {
        $unwind: "$shipment"
    },

    /*
     * Stage 4
     * Group by sensor type.
     */
    {
        $group: {

            _id: "$sensor_type",

            total_events: {
                $sum: 1
            },

            anomaly_events: {

                $sum: {

                    $cond: [

                        "$anomaly_flag",

                        1,

                        0

                    ]

                }

            },

            average_shipment_delay: {

                $avg: {

                    $cond: [

                        "$anomaly_flag",

                        "$shipment.delay_hours",

                        "$$REMOVE"

                    ]

                }

            },

            average_shipment_risk: {

                $avg: {

                    $cond: [

                        "$anomaly_flag",

                        "$shipment.risk_score",

                        "$$REMOVE"

                    ]

                }

            },

            average_risk_delta: {

                $avg: {

                    $cond: [

                        "$anomaly_flag",

                        "$risk_score_delta",

                        "$$REMOVE"

                    ]

                }

            },

            average_delay_added: {

                $avg: {

                    $cond: [

                        "$anomaly_flag",

                        "$delay_added_hours",

                        "$$REMOVE"

                    ]

                }

            }

        }
    },

    /*
     * Stage 5
     * Calculate anomaly rate.
     */
    {
        $addFields: {

            anomaly_rate: {

                $multiply: [

                    {

                        $divide: [

                            "$anomaly_events",

                            "$total_events"

                        ]

                    },

                    100

                ]

            }

        }
    },

    /*
     * Stage 6
     * Rank sensors.
     */
    {
        $sort: {

            anomaly_rate: -1,

            average_risk_delta: -1,

            average_delay_added: -1

        }
    },

    /*
     * Stage 7
     * Limit output.
     */
    {
        $limit: 20
    }

]);