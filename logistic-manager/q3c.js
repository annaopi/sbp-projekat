//total CO2
db.shipments.aggregate([

    /*
     * Stage 1
     * Retrieve shipment information.
     */
    {
        $project: {
            shipment_id: 1,
            origin_port: 1,
            destination_port: 1,
            value_usd: 1,
            volume_m3: 1
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
     * Keep only shipments that have events.
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
     * Sum CO₂ emissions for each shipment.
     */
    {
        $group: {

            _id: "$shipment_id",

            origin_port: {
                $first: "$origin_port"
            },

            destination_port: {
                $first: "$destination_port"
            },

            value_usd: {
                $first: "$value_usd"
            },

            volume_m3: {
                $first: "$volume_m3"
            },

            total_shipment_co2: {
                $sum: "$events.co2_kg"
            }

        }
    },

    /*
     * Stage 6
     * Create a readable route identifier.
     */
    {
        $addFields: {

            route: {

                $concat: [

                    "$origin_port",

                    " → ",

                    "$destination_port"

                ]

            }

        }
    },

    /*
     * Stage 7
     * Arrange shipments by total CO₂.
     */
    {
        $sort: {

            total_shipment_co2: -1

        }
    },

    /*
     * Stage 8
     * Limit output while testing.
     */
    {
        $limit: 20
    }

]);

//value efficiency
db.shipments.aggregate([

    /*
     * Stage 1
     * Retrieve shipment information.
     */
    {
        $project: {
            shipment_id: 1,
            origin_port: 1,
            destination_port: 1,
            value_usd: 1,
            volume_m3: 1
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
     * Keep shipments having events.
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
     * Calculate total CO₂ for each shipment.
     */
    {
        $group: {

            _id: "$shipment_id",

            origin_port: {
                $first: "$origin_port"
            },

            destination_port: {
                $first: "$destination_port"
            },

            value_usd: {
                $first: "$value_usd"
            },

            volume_m3: {
                $first: "$volume_m3"
            },

            total_shipment_co2: {
                $sum: "$events.co2_kg"
            }

        }
    },

    /*
     * Stage 6
     * Create the route identifier.
     */
    {
        $addFields: {

            route: {

                $concat: [

                    "$origin_port",

                    " → ",

                    "$destination_port"

                ]

            }

        }
    },

    /*
     * Stage 7
     * Aggregate shipments by route.
     */
    {
        $group: {

            _id: "$route",

            shipment_count: {
                $sum: 1
            },

            total_co2: {
                $sum: "$total_shipment_co2"
            },

            average_co2: {
                $avg: "$total_shipment_co2"
            },

            total_value: {
                $sum: "$value_usd"
            },

            total_volume: {
                $sum: "$volume_m3"
            }

        }
    },

    /*
     * Stage 8
     * Calculate efficiency indicators.
     */
    {
        $addFields: {

            co2_per_usd: {

                $cond: [

                    {
                        $eq: [
                            "$total_value",
                            0
                        ]
                    },

                    null,

                    {
                        $divide: [
                            "$total_co2",
                            "$total_value"
                        ]
                    }

                ]

            },

            co2_per_m3: {

                $cond: [

                    {
                        $eq: [
                            "$total_volume",
                            0
                        ]
                    },

                    null,

                    {
                        $divide: [
                            "$total_co2",
                            "$total_volume"
                        ]
                    }

                ]

            }

        }
    },

    /*
    * Stage 9
    * Rank routes by CO₂ per USD.
    */
    {
        $sort: {

            co2_per_usd: -1,

            total_co2: -1

        }
    },

    /*
    * Stage 10
    * Limit output.
    */
    {
        $limit: 20
    }

]);

//volume efficiency
db.shipments.aggregate([

    /*
     * Stage 1
     * Retrieve shipment information.
     */
    {
        $project: {
            shipment_id: 1,
            origin_port: 1,
            destination_port: 1,
            value_usd: 1,
            volume_m3: 1
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
     * Keep shipments having events.
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
     * Calculate total CO₂ for each shipment.
     */
    {
        $group: {

            _id: "$shipment_id",

            origin_port: {
                $first: "$origin_port"
            },

            destination_port: {
                $first: "$destination_port"
            },

            value_usd: {
                $first: "$value_usd"
            },

            volume_m3: {
                $first: "$volume_m3"
            },

            total_shipment_co2: {
                $sum: "$events.co2_kg"
            }

        }
    },

    /*
     * Stage 6
     * Create the route identifier.
     */
    {
        $addFields: {

            route: {

                $concat: [

                    "$origin_port",

                    " → ",

                    "$destination_port"

                ]

            }

        }
    },

    /*
     * Stage 7
     * Aggregate shipments by route.
     */
    {
        $group: {

            _id: "$route",

            shipment_count: {
                $sum: 1
            },

            total_co2: {
                $sum: "$total_shipment_co2"
            },

            average_co2: {
                $avg: "$total_shipment_co2"
            },

            total_value: {
                $sum: "$value_usd"
            },

            total_volume: {
                $sum: "$volume_m3"
            }

        }
    },

    /*
     * Stage 8
     * Calculate efficiency indicators.
     */
    {
        $addFields: {

            co2_per_usd: {

                $cond: [

                    {
                        $eq: [
                            "$total_value",
                            0
                        ]
                    },

                    null,

                    {
                        $divide: [
                            "$total_co2",
                            "$total_value"
                        ]
                    }

                ]

            },

            co2_per_m3: {

                $cond: [

                    {
                        $eq: [
                            "$total_volume",
                            0
                        ]
                    },

                    null,

                    {
                        $divide: [
                            "$total_co2",
                            "$total_volume"
                        ]
                    }

                ]

            }

        }
    },

    /*
    * Stage 9
    * Rank routes by CO₂ per cubic meter.
    */
    {
        $sort: {

            co2_per_m3: -1,

            total_co2: -1

        }
    },

    {
        $limit: 20
    }

]);
