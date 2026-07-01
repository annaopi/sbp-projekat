//carriers
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

//transport
db.shipments.aggregate([

    {
        $project: {
            shipment_id: 1,
            risk_score: 1,
            transport_mode: 1
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

            transport_mode: {
                $first: "$transport_mode"
            },

            initial_risk: {
                $first: "$risk_score"
            },

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

            _id: "$transport_mode",

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

//goods
db.shipments.aggregate([

    {
        $project: {
            shipment_id: 1,
            risk_score: 1,
            goods_category: 1
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

            goods_category: {
                $first: "$goods_category"
            },

            initial_risk: {
                $first: "$risk_score"
            },

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

            _id: "$goods_category",

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

//priority
db.shipments.aggregate([

    {
        $project: {
            shipment_id: 1,
            risk_score: 1,
            priority_level: 1
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

    {
        $match: {
            risk_growth_percentage: {
                $gt: 30
            }
        }
    },

    {
        $group: {

            _id: "$priority_level",

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