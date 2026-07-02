//highest cumulative port waiting time
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
            delay_hours: 1
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
     * Keep shipments having route events.
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
     * One document per route event.
     */
    {
        $unwind: "$events"
    },

    /*
     * Stage 5
     * Calculate shipment-level port waiting.
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

            delay_hours: {
                $first: "$delay_hours"
            },

            total_port_wait: {
                $sum: "$events.port_wait_hours"
            }

        }
    },

    /*
     * Stage 6
     * Create route identifier.
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

            total_port_wait: {
                $sum: "$total_port_wait"
            },

            average_port_wait: {
                $avg: "$total_port_wait"
            },

            total_delay: {
                $sum: "$delay_hours"
            },

            average_delay: {
                $avg: "$delay_hours"
            }

        }
    },

    /*
     * Stage 8
     * Calculate contribution percentage.
     */
    {
        $addFields: {

            contribution_percentage: {

                $cond: [

                    {
                        $eq: [
                            "$total_delay",
                            0
                        ]
                    },

                    null,

                    {
                        $multiply: [

                            {
                                $divide: [

                                    "$total_port_wait",

                                    "$total_delay"

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
    * Stage 9
    * Rank by total port waiting time.
    */
    {
        $sort: {

            total_port_wait: -1,

            shipment_count: -1

        }
    },

    /*
     * Stage 10
     * Limit output while testing.
     */
    {
        $limit: 20
    }

]);

//highest cumulative port waiting time
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
            delay_hours: 1
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
     * Keep shipments having route events.
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
     * One document per route event.
     */
    {
        $unwind: "$events"
    },

    /*
     * Stage 5
     * Calculate shipment-level port waiting.
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

            delay_hours: {
                $first: "$delay_hours"
            },

            total_port_wait: {
                $sum: "$events.port_wait_hours"
            }

        }
    },

    /*
     * Stage 6
     * Create route identifier.
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

            total_port_wait: {
                $sum: "$total_port_wait"
            },

            average_port_wait: {
                $avg: "$total_port_wait"
            },

            total_delay: {
                $sum: "$delay_hours"
            },

            average_delay: {
                $avg: "$delay_hours"
            }

        }
    },

    /*
     * Stage 8
     * Calculate contribution percentage.
     */
    {
        $addFields: {

            contribution_percentage: {

                $cond: [

                    {
                        $eq: [
                            "$total_delay",
                            0
                        ]
                    },

                    null,

                    {
                        $multiply: [

                            {
                                $divide: [

                                    "$total_port_wait",

                                    "$total_delay"

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
    * Stage 9
    * Rank by total port waiting time.
    */
    {
        $sort: {

            contribution_percentage: -1,

            total_port_wait: -1

        }
    },

    /*
     * Stage 10
     * Limit output while testing.
     */
    {
        $limit: 20
    }

]);
