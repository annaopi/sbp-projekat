db.shipments.aggregate([

    /*
     * Stage 1
     * Keep only required shipment fields.
     */
    {
        $project: {

            shipment_id: 1,

            risk_score: 1,

            carrier: 1,

            transport_mode: 1,

            goods_category: 1,

            priority_level: 1

        }
    },

    /*
     * Stage 2
     * Join route events.
     */
    {
        $lookup: {

            from: "route_events",

            localField: "shipment_id",

            foreignField: "shipment_id",

            as: "events"

        }
    },

    /*
     * Stage 3
     * Ignore shipments without events.
     */
    {
        $match: {

            "events.0": {

                $exists: true

            }

        }
    },

    /*
     * Stage 4
     * One document per event.
     */
    {
        $unwind: "$events"
    },

    /*
     * Stage 5
     * Rebuild shipment while summing risk changes.
     */
    {
        $group: {

            _id: "$shipment_id",

            carrier: {
                $first: "$carrier"
            },

            transport_mode: {
                $first: "$transport_mode"
            },

            goods_category: {
                $first: "$goods_category"
            },

            priority_level: {
                $first: "$priority_level"
            },

            initial_risk: {
                $first: "$risk_score"
            },

            cumulative_risk_delta: {
                $sum: "$events.risk_score_delta"
            }

        }
    },

    /*
     * Stage 6
     * Calculate final risk.
     */
    {
        $addFields: {

            final_risk: {

                $add: [

                    "$initial_risk",

                    "$cumulative_risk_delta"

                ]

            }

        }
    },

    {
    $addFields: {
        risk_growth_percentage: {
            $cond: [
                { $eq: ["$initial_risk", 0] },
                null,
                {
                    $multiply: [
                        {
                            $divide: [
                                "$cumulative_risk_delta",
                                "$initial_risk"
                            ]
                        },
                        100
                        ]
                    }
                ]
            }
        }
    },

    /*
     * Stage 8
     * Keep only shipments
     * whose risk increased by more than 30%.
     */
    {
        $match: {

            risk_growth_percentage: {

                $gt: 30

            }

        }
    },

    /*
     * Stage 9
     * Rank by largest increase.
     */
    {
        $sort: {

            risk_growth_percentage: -1

        }
    },

    /*
     * Stage 10
     * Testing output.
     */
    {
        $limit: 20
    }

]);

db.shipments.aggregate([

    /*
     * Stage 1
     * Keep required shipment fields.
     */
    {
        $project: {
            shipment_id: 1,
            risk_score: 1,
            carrier: 1,
            transport_mode: 1,
            goods_category: 1,
            priority_level: 1
        }
    },

    /*
     * Stage 2
     * Join route events.
     */
    {
        $lookup: {
            from: "route_events",
            localField: "shipment_id",
            foreignField: "shipment_id",
            as: "events"
        }
    },

    /*
     * Stage 3
     * Ignore shipments without events.
     */
    {
        $match: {
            "events.0": { $exists: true }
        }
    },

    /*
     * Stage 4
     * One document per event.
     */
    {
        $unwind: "$events"
    },

    /*
     * Stage 5
     * Calculate cumulative risk change.
     */
    {
        $group: {

            _id: "$shipment_id",

            carrier: {
                $first: "$carrier"
            },

            transport_mode: {
                $first: "$transport_mode"
            },

            goods_category: {
                $first: "$goods_category"
            },

            priority_level: {
                $first: "$priority_level"
            },

            initial_risk: {
                $first: "$risk_score"
            },

            cumulative_risk_delta: {
                $sum: "$events.risk_score_delta"
            }

        }
    },

    /*
     * Stage 6
     * Final risk.
     */
    {
        $addFields: {

            final_risk: {
                $add: [
                    "$initial_risk",
                    "$cumulative_risk_delta"
                ]
            }

        }
    },

    /*
     * Stage 7
     * Risk growth percentage.
     */
    {
        $addFields: {

            risk_growth_percentage: {

                $cond: [

                    {
                        $eq: [
                            "$initial_risk",
                            0
                        ]
                    },

                    null,

                    {
                        $multiply: [

                            {
                                $divide: [
                                    "$cumulative_risk_delta",
                                    "$initial_risk"
                                ]
                            },

                            100

                        ]
                    }

                ]

            }

        }
    },

    /*
     * Stage 8
     * High-risk-growth shipments only.
     */
    {
        $match: {

            risk_growth_percentage: {
                $gt: 30
            }

        }
    },

    /*
     * Stage 9
     * Group shipment profiles.
     */
    {
        $group: {

            _id: {

                carrier: "$carrier",

                transport_mode: "$transport_mode",

                goods_category: "$goods_category",

                priority_level: "$priority_level"

            },

            shipment_count: {
                $sum: 1
            },

            average_initial_risk: {
                $avg: "$initial_risk"
            },

            average_final_risk: {
                $avg: "$final_risk"
            },

            average_risk_growth: {
                $avg: "$risk_growth_percentage"
            },

            average_cumulative_delta: {
                $avg: "$cumulative_risk_delta"
            }

        }
    },

    /*
     * Stage 10
     * Rank most common profiles.
     */
    {
        $sort: {

            shipment_count: -1,

            average_risk_growth: -1

        }
    },

    /*
     * Stage 11
     * Show first results.
     */
    {
        $limit: 20
    }

]);

db.shipments.aggregate([

    {
        $project: {
            shipment_id: 1,
            risk_score: 1,
            carrier: 1
        }
    },

    {
        $lookup: {
            from: "route_events",
            localField: "shipment_id",
            foreignField: "shipment_id",
            as: "events"
        }
    },

    {
        $match: {
            "events.0": { $exists: true }
        }
    },

    {
        $unwind: "$events"
    },

    {
        $group: {
            _id: "$shipment_id",

            carrier: { $first: "$carrier" },

            initial_risk: { $first: "$risk_score" },

            cumulative_risk_delta: {
                $sum: "$events.risk_score_delta"
            }
        }
    },

    {
        $addFields: {

            final_risk: {
                $add: [
                    "$initial_risk",
                    "$cumulative_risk_delta"
                ]
            },

            risk_growth_percentage: {
                $cond: [
                    { $eq: ["$initial_risk", 0] },
                    null,
                    {
                        $multiply: [
                            {
                                $divide: [
                                    "$cumulative_risk_delta",
                                    "$initial_risk"
                                ]
                            },
                            100
                        ]
                    }
                ]
            }

        }
    },

    {
        $match: {
            risk_growth_percentage: { $gt: 30 }
        }
    },

    {
        $group: {

            _id: "$carrier",

            shipment_count: {
                $sum: 1
            },

            average_initial_risk: {
                $avg: "$initial_risk"
            },

            average_final_risk: {
                $avg: "$final_risk"
            },

            average_risk_growth: {
                $avg: "$risk_growth_percentage"
            },

            average_cumulative_delta: {
                $avg: "$cumulative_risk_delta"
            }

        }
    },

    {
        $sort: {

            shipment_count: -1,

            average_risk_growth: -1

        }
    }

]);