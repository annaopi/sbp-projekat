use("shipments");

/*
===========================================================
Question 1

Which carrier–transport mode combinations consistently
exceed planned transit times, and what sequences of
operational events most commonly precede these delays?

Version 1
----------
Goal:
- Select required shipment fields
- Calculate delay ratio
- Keep only delayed shipments
- Display sample results

Collections:
- shipments

===========================================================
*/

db.shipments.aggregate([

    /*
     * Stage 1
     * Select only fields needed for this analysis.
     */
    {
        $project: {
            _id: 0,
            shipment_id: 1,
            carrier: 1,
            transport_mode: 1,
            transit_hours: 1,
            delay_hours: 1
        }
    },

    /*
     * Stage 2
     * Calculate delay ratio.
     */
    {
        $addFields: {
            delay_ratio: {
                $divide: [
                    "$delay_hours",
                    "$transit_hours"
                ]
            }
        }
    },

    /*
     * Stage 3
     * Keep only significantly delayed shipments.
     *
     * Current definition:
     * delay_ratio > 0.20
     *
     * (Later we may also combine this with
     * delay_hours > 10.)
     */
    {
        $match: {
            delay_ratio: {
                $gt: 0.20
            }
        }
    },

    /*
     * Stage 4
     * Display only a few documents while testing.
     */
    {
        $limit: 3
    },

    //VERSION 2
    /*
    * Stage 5
    * Attach all route events belonging
    * to each delayed shipment.
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
    * Stage 6
    * Keep only shipments that actually
    * have route events.
    */
    {
        $match: {
            "events.0": {
                $exists: true
            }
        }
    },

    //VERSION 3
    /*
    * Stage 7
    * Create one document per route event.
    */
    {
        $unwind: "$events"
    },

    /*
    * Stage 8
    * Convert event_timestamp from String to Date.
    */
    {
        $addFields: {
            "events.event_date": {
                $dateFromString: {
                    dateString: "$events.event_timestamp",
                    format: "%Y-%m-%d %H:%M:%S"
                }
            }
        }
    },

    /*
    * Stage 9
    * Sort events chronologically for each shipment.
    */
    {
        $sort: {
            shipment_id: 1,
            "events.event_date": 1
        }
    },

    /*
    * Stage 10
    * Reconstruct each shipment and build
    * an ordered event sequence.
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

            delay_hours: {
                $first: "$delay_hours"
            },

            delay_ratio: {
                $first: "$delay_ratio"
            },

            /*
            * Ordered event history
            */
            event_sequence: {
                $push: "$events.event_type"
            },

            /*
            * Total operational delay
            */
            total_delay_added: {
                $sum: "$events.delay_added_hours"
            },

            /*
            * Total waiting in ports
            */
            total_port_wait: {
                $sum: "$events.port_wait_hours"
            },

            /*
            * Total change in shipment risk
            */
            total_risk_delta: {
                $sum: "$events.risk_score_delta"
            }
        }
    },

    /*
    stage 11 - limit
    */
    {
        $limit: 3
    },

    /*
    * Stage 12
    * Group delayed shipments by
    * carrier and transport mode.
    */
    {
        $group: {

            _id: {
                carrier: "$carrier",
                transport_mode: "$transport_mode"
            },

            /*
            * Number of delayed shipments
            */
            delayed_shipments: {
                $sum: 1
            },

            /*
            * Average shipment delay
            */
            average_delay_hours: {
                $avg: "$delay_hours"
            },

            /*
            * Average delay ratio
            */
            average_delay_ratio: {
                $avg: "$delay_ratio"
            },

            /*
            * Average operational delay
            */
            average_delay_added: {
                $avg: "$total_delay_added"
            },

            /*
            * Average port waiting time
            */
            average_port_wait: {
                $avg: "$total_port_wait"
            },

            /*
            * Average cumulative risk increase
            */
            average_risk_delta: {
                $avg: "$total_risk_delta"
            },

            /*
            * Keep all reconstructed
            * event histories.
            */
            event_sequences: {
                $push: "$event_sequence"
            }
        }
    },

    /*
    * Stage 13
    * Worst-performing carrier/mode
    * combinations first.
    */
    {
        $sort: {
            average_delay_hours: -1
        }
    },

    /*
    * Stage 14
    * Display only a few groups.
    */
    {
        $limit: 10
    }
]);

/*
 * PIPELINE B
 * Operational Event Analysis
 *
 * Determine which operational events occur most frequently
 * for delayed shipments of each carrier-transport mode
 * combination.
 */

db.shipments.aggregate([

    /*
     * Stage 1
     * Calculate shipment delay ratio.
     */
    {
        $addFields: {
            delay_ratio: {
                $divide: [
                    "$delay_hours",
                    "$transit_hours"
                ]
            }
        }
    },

    /*
     * Stage 2
     * Keep only significantly delayed shipments.
     */
    {
        $match: {
            delay_ratio: {
                $gt: 0.20
            }
        }
    },

    /*
     * Stage 3
     * Join shipment events.
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
     * Stage 4
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
     * Stage 5
     * Create one document per event.
     */
    {
        $unwind: "$events"
    },

    /*
     * Stage 6
     * Group by carrier,
     * transport mode
     * and event type.
     */
    {
        $group: {

            _id: {

                carrier: "$carrier",

                transport_mode: "$transport_mode",

                event_type: "$events.event_type"

            },

            /*
             * Total number of occurrences.
             */
            occurrences: {
                $sum: 1
            },

            /*
             * Distinct delayed shipments
             * containing this event.
             */
            shipments: {
                $addToSet: "$shipment_id"
            },

            /*
             * Average total shipment delay.
             */
            average_total_delay: {
                $avg: "$delay_hours"
            },

            /*
             * Average delay introduced
             * by this event.
             */
            average_delay_added: {
                $avg: "$events.delay_added_hours"
            },

            /*
             * Average waiting time in ports.
             */
            average_port_wait: {
                $avg: "$events.port_wait_hours"
            },

            /*
             * Average risk increase.
             */
            average_risk_delta: {
                $avg: "$events.risk_score_delta"
            }

        }
    },

    /*
     * Stage 7
     * Compute number of affected shipments.
     */
    {
        $project: {

            occurrences: 1,

            average_total_delay: 1,

            average_delay_added: 1,

            average_port_wait: 1,

            average_risk_delta: 1,

            shipment_count: {
                $size: "$shipments"
            }

        }
    },

    /*
     * Stage 8
     * Rank events.
     */
    {
        $sort: {

            "_id.carrier": 1,

            "_id.transport_mode": 1,

            average_delay_added: -1,

            occurrences: -1

        }
    },

    /*
     * Stage 9
     * Limit output while testing.
     */
    {
        $limit: 20
    }

]);

/*
 * PIPELINE C
 * Disruptive Operational Event Analysis
 *
 * Determine which disruptive operational events
 * are most strongly associated with delayed shipments.
 */

db.shipments.aggregate([

    /*
     * Stage 1
     * Calculate delay ratio.
     */
    {
        $addFields: {
            delay_ratio: {
                $divide: [
                    "$delay_hours",
                    "$transit_hours"
                ]
            }
        }
    },

    /*
     * Stage 2
     * Keep delayed shipments.
     */
    {
        $match: {
            delay_ratio: {
                $gt: 0.20
            }
        }
    },

    /*
     * Stage 3
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
     * Stage 4
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
     * Stage 5
     * One document per event.
     */
    {
        $unwind: "$events"
    },

    /*
     * Stage 6
     * Keep only disruptive events.
     */
    {
        $match: {
            "events.event_type": {
                $in: [
                    "weather_hold",
                    "congestion_hold",
                    "mechanical_stop",
                    "reroute",
                    "temperature_alert",
                    "delayed_notification",
                    "inspection",
                    "customs_check"
                ]
            }
        }
    },

    /*
     * Stage 7
     * Group by carrier,
     * transport mode
     * and disruptive event.
     */
    {
        $group: {

            _id: {

                carrier: "$carrier",

                transport_mode: "$transport_mode",

                event_type: "$events.event_type"

            },

            occurrences: {
                $sum: 1
            },

            shipments: {
                $addToSet: "$shipment_id"
            },

            average_total_delay: {
                $avg: "$delay_hours"
            },

            average_delay_added: {
                $avg: "$events.delay_added_hours"
            },

            average_port_wait: {
                $avg: "$events.port_wait_hours"
            },

            average_risk_delta: {
                $avg: "$events.risk_score_delta"
            }

        }
    },

    /*
     * Stage 8
     * Compute number of affected shipments.
     */
    {
        $project: {

            occurrences: 1,

            shipment_count: {
                $size: "$shipments"
            },

            average_total_delay: 1,

            average_delay_added: 1,

            average_port_wait: 1,

            average_risk_delta: 1

        }
    },

    /*
     * Stage 9
     * Rank results.
     */
    {
        $sort: {

            "_id.carrier": 1,

            "_id.transport_mode": 1,

            average_delay_added: -1,

            occurrences: -1

        }
    },

    /*
     * Stage 10
     * Testing limit.
     */
    {
        $limit: 20
    }

]);

/*
 * PIPELINE C.1
 *
 * Reconstruct the chronological history of disruptive events
 * for every delayed shipment.
 */

db.shipments.aggregate([

    /*
     * Stage 1
     * Calculate delay ratio.
     */
    {
        $addFields: {
            delay_ratio: {
                $divide: [
                    "$delay_hours",
                    "$transit_hours"
                ]
            }
        }
    },

    /*
     * Stage 2
     * Keep delayed shipments.
     */
    {
        $match: {
            delay_ratio: {
                $gt: 0.20
            }
        }
    },

    /*
     * Stage 3
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
     * Stage 4
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
     * Stage 5
     * One document per event.
     */
    {
        $unwind: "$events"
    },

    /*
     * Stage 6
     * Keep only disruptive events.
     */
    {
        $match: {
            "events.event_type": {
                $in: [
                    "weather_hold",
                    "congestion_hold",
                    "mechanical_stop",
                    "reroute",
                    "temperature_alert",
                    "delayed_notification",
                    "inspection",
                    "customs_check"
                ]
            }
        }
    },

    /*
     * Stage 7
     * Convert timestamp into a proper Date.
     */
    {
        $addFields: {
            event_time: {
                $dateFromString: {
                    dateString: "$events.event_timestamp",
                    format: "%Y-%m-%d %H:%M:%S"
                }
            }
        }
    },

    /*
     * Stage 8
     * Sort events chronologically.
     */
    {
        $sort: {
            shipment_id: 1,
            event_time: 1
        }
    },

    /*
     * Stage 9
     * Rebuild the shipment history.
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

            delay_hours: {
                $first: "$delay_hours"
            },

            delay_ratio: {
                $first: "$delay_ratio"
            },

            events: {
                $push: {

                    event_type: "$events.event_type",

                    timestamp: "$event_time",

                    delay_added_hours: "$events.delay_added_hours",

                    port_wait_hours: "$events.port_wait_hours",

                    risk_score_delta: "$events.risk_score_delta"

                }
            }

        }
    },

    /*
     * Stage 10
     * Show only a few histories while testing.
     */
    {
        $limit: 10
    }

]);

/*
 * PIPELINE C.2
 *
 * Extract consecutive disruptive-event transitions
 * for every delayed shipment.
 */

db.shipments.aggregate([

    /*
     * Stage 1
     * Calculate delay ratio.
     */
    {
        $addFields: {
            delay_ratio: {
                $divide: [
                    "$delay_hours",
                    "$transit_hours"
                ]
            }
        }
    },

    /*
     * Stage 2
     * Keep delayed shipments.
     */
    {
        $match: {
            delay_ratio: {
                $gt: 0.20
            }
        }
    },

    /*
     * Stage 3
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
     * Stage 4
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
     * Stage 5
     * One document per event.
     */
    {
        $unwind: "$events"
    },

    /*
     * Stage 6
     * Keep only disruptive events.
     */
    {
        $match: {
            "events.event_type": {
                $in: [
                    "weather_hold",
                    "congestion_hold",
                    "mechanical_stop",
                    "reroute",
                    "temperature_alert",
                    "delayed_notification",
                    "inspection",
                    "customs_check"
                ]
            }
        }
    },

    /*
     * Stage 7
     * Convert timestamp.
     */
    {
        $addFields: {
            event_time: {
                $dateFromString: {
                    dateString: "$events.event_timestamp",
                    format: "%Y-%m-%d %H:%M:%S"
                }
            }
        }
    },

    /*
     * Stage 8
     * Sort chronologically.
     */
    {
        $sort: {
            shipment_id: 1,
            event_time: 1
        }
    },

    /*
     * Stage 9
     * Build ordered event list.
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

            delay_hours: {
                $first: "$delay_hours"
            },

            events: {
                $push: "$events.event_type"
            }

        }
    },

    /*
     * Stage 10
     * Keep only shipments with
     * at least two disruptive events.
     */
    {
        $match: {
            $expr: {
                $gte: [
                    {
                        $size: "$events"
                    },
                    2
                ]
            }
        }
    },

    /*
     * Stage 11
     * Build consecutive transitions.
     */
    {
        $project: {

            carrier: 1,

            transport_mode: 1,

            delay_hours: 1,

            transitions: {

                $map: {

                    input: {
                        $range: [
                            0,
                            {
                                $subtract: [
                                    {
                                        $size: "$events"
                                    },
                                    1
                                ]
                            }
                        ]
                    },

                    as: "i",

                    in: {

                        from: {
                            $arrayElemAt: [
                                "$events",
                                "$$i"
                            ]
                        },

                        to: {
                            $arrayElemAt: [
                                "$events",
                                {
                                    $add: [
                                        "$$i",
                                        1
                                    ]
                                }
                            ]
                        }

                    }

                }

            }

        }

    },

    /*
     * Stage 12
     * Test output.
     */
    {
        $limit: 10
    }

]);

/*
 * PIPELINE C.3
 *
 * Rank operational event transitions.
 */

db.shipments.aggregate([

    /*
     * Stage 1
     * Calculate delay ratio.
     */
    {
        $addFields: {
            delay_ratio: {
                $divide: [
                    "$delay_hours",
                    "$transit_hours"
                ]
            }
        }
    },

    /*
     * Stage 2
     * Keep delayed shipments.
     */
    {
        $match: {
            delay_ratio: {
                $gt: 0.20
            }
        }
    },

    /*
     * Stage 3
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
     * Stage 4
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
     * Stage 5
     * One document per event.
     */
    {
        $unwind: "$events"
    },

    /*
     * Stage 6
     * Keep disruptive events.
     */
    {
        $match: {
            "events.event_type": {
                $in: [
                    "weather_hold",
                    "congestion_hold",
                    "mechanical_stop",
                    "reroute",
                    "temperature_alert",
                    "delayed_notification",
                    "inspection",
                    "customs_check"
                ]
            }
        }
    },

    /*
     * Stage 7
     * Convert timestamp.
     */
    {
        $addFields: {
            event_time: {
                $dateFromString: {
                    dateString: "$events.event_timestamp",
                    format: "%Y-%m-%d %H:%M:%S"
                }
            }
        }
    },

    /*
     * Stage 8
     * Chronological ordering.
     */
    {
        $sort: {
            shipment_id: 1,
            event_time: 1
        }
    },

    /*
     * Stage 9
     * Build event history.
     */
    {
        $group: {

            _id: "$shipment_id",

            delay_hours: {
                $first: "$delay_hours"
            },

            carrier: {
                $first: "$carrier"
            },

            transport_mode: {
                $first: "$transport_mode"
            },

            events: {
                $push: {
                    event_type: "$events.event_type",
                    risk_delta: "$events.risk_score_delta",
                    delay_added: "$events.delay_added_hours",
                    port_wait: "$events.port_wait_hours"
                }
            }

        }
    },

    /*
     * Stage 10
     * Require at least two events.
     */
    {
        $match: {
            $expr: {
                $gte: [
                    {
                        $size: "$events"
                    },
                    2
                ]
            }
        }
    },

    /*
     * Stage 11
     * Build transition objects.
     */
    {
        $project: {

            delay_hours: 1,

            transitions: {

                $map: {

                    input: {
                        $range: [
                            0,
                            {
                                $subtract: [
                                    {
                                        $size: "$events"
                                    },
                                    1
                                ]
                            }
                        ]
                    },

                    as: "i",

                    in: {

                        from: {
                            $arrayElemAt: [
                                "$events.event_type",
                                "$$i"
                            ]
                        },

                        to: {
                            $arrayElemAt: [
                                "$events.event_type",
                                {
                                    $add: [
                                        "$$i",
                                        1
                                    ]
                                }
                            ]
                        },

                        risk_delta: {
                            $arrayElemAt: [
                                "$events.risk_delta",
                                {
                                    $add: [
                                        "$$i",
                                        1
                                    ]
                                }
                            ]
                        },

                        delay_added: {
                            $arrayElemAt: [
                                "$events.delay_added",
                                {
                                    $add: [
                                        "$$i",
                                        1
                                    ]
                                }
                            ]
                        },

                        port_wait: {
                            $arrayElemAt: [
                                "$events.port_wait",
                                {
                                    $add: [
                                        "$$i",
                                        1
                                    ]
                                }
                            ]
                        }

                    }

                }

            }

        }

    },

    /*
     * Stage 12
     * One document per transition.
     */
    {
        $unwind: "$transitions"
    },

    /*
     * Stage 13
     * Group identical transitions.
     */
    {
        $group: {

            _id: {

                from: "$transitions.from",

                to: "$transitions.to"

            },

            occurrences: {
                $sum: 1
            },

            average_total_delay: {
                $avg: "$delay_hours"
            },

            average_delay_added: {
                $avg: "$transitions.delay_added"
            },

            average_port_wait: {
                $avg: "$transitions.port_wait"
            },

            average_risk_delta: {
                $avg: "$transitions.risk_delta"
            }

        }

    },

    /*
     * Stage 14
     * Rank transitions.
     */
    {
        $sort: {

            occurrences: -1,

            average_total_delay: -1

        }
    },

    /*
     * Stage 15
     * Show the strongest transitions.
     */
    {
        $limit: 20
    }

]);

/*
 * PIPELINE C.3+
 *
 * Rank disruptive transitions
 * inside every carrier–transport mode.
 */

db.shipments.aggregate([

    /*
     * Stage 1
     */
    {
        $addFields: {
            delay_ratio: {
                $divide: [
                    "$delay_hours",
                    "$transit_hours"
                ]
            }
        }
    },

    /*
     * Stage 2
     */
    {
        $match: {
            delay_ratio: {
                $gt: 0.20
            }
        }
    },

    /*
     * Stage 3
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
     * Stage 4
     */
    {
        $match: {
            "events.0": {
                $exists: true
            }
        }
    },

    /*
     * Stage 5
     */
    {
        $unwind: "$events"
    },

    /*
     * Stage 6
     */
    {
        $match: {
            "events.event_type": {
                $in: [
                    "weather_hold",
                    "congestion_hold",
                    "mechanical_stop",
                    "reroute",
                    "temperature_alert",
                    "delayed_notification",
                    "inspection",
                    "customs_check"
                ]
            }
        }
    },

    /*
     * Stage 7
     */
    {
        $addFields: {
            event_time: {
                $dateFromString: {
                    dateString: "$events.event_timestamp",
                    format: "%Y-%m-%d %H:%M:%S"
                }
            }
        }
    },

    /*
     * Stage 8
     */
    {
        $sort: {
            shipment_id: 1,
            event_time: 1
        }
    },

    /*
     * Stage 9
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

            delay_hours: {
                $first: "$delay_hours"
            },

            events: {
                $push: {
                    type: "$events.event_type",
                    delay_added: "$events.delay_added_hours",
                    port_wait: "$events.port_wait_hours",
                    risk_delta: "$events.risk_score_delta"
                }
            }

        }
    },

    /*
     * Stage 10
     */
    {
        $match: {
            $expr: {
                $gte: [
                    {
                        $size: "$events"
                    },
                    2
                ]
            }
        }
    },

    /*
     * Stage 11
     */
    {
        $project: {

            carrier: 1,

            transport_mode: 1,

            delay_hours: 1,

            transitions: {

                $map: {

                    input: {
                        $range: [
                            0,
                            {
                                $subtract: [
                                    {
                                        $size: "$events"
                                    },
                                    1
                                ]
                            }
                        ]
                    },

                    as: "i",

                    in: {

                        from: {
                            $arrayElemAt: [
                                "$events.type",
                                "$$i"
                            ]
                        },

                        to: {
                            $arrayElemAt: [
                                "$events.type",
                                {
                                    $add: [
                                        "$$i",
                                        1
                                    ]
                                }
                            ]
                        },

                        delay_added: {
                            $arrayElemAt: [
                                "$events.delay_added",
                                {
                                    $add: [
                                        "$$i",
                                        1
                                    ]
                                }
                            ]
                        },

                        port_wait: {
                            $arrayElemAt: [
                                "$events.port_wait",
                                {
                                    $add: [
                                        "$$i",
                                        1
                                    ]
                                }
                            ]
                        },

                        risk_delta: {
                            $arrayElemAt: [
                                "$events.risk_delta",
                                {
                                    $add: [
                                        "$$i",
                                        1
                                    ]
                                }
                            ]
                        }

                    }

                }

            }

        }

    },

    /*
     * Stage 12
     */
    {
        $unwind: "$transitions"
    },

    /*
     * Stage 13
     */
    {
        $group: {

            _id: {

                carrier: "$carrier",

                transport_mode: "$transport_mode",

                from: "$transitions.from",

                to: "$transitions.to"

            },

            occurrences: {
                $sum: 1
            },

            average_total_delay: {
                $avg: "$delay_hours"
            },

            average_delay_added: {
                $avg: "$transitions.delay_added"
            },

            average_port_wait: {
                $avg: "$transitions.port_wait"
            },

            average_risk_delta: {
                $avg: "$transitions.risk_delta"
            }

        }

    },

    /*
     * Stage 14
     */
    {
        $sort: {

            "_id.carrier": 1,

            "_id.transport_mode": 1,

            occurrences: -1,

            average_total_delay: -1

        }
    },

    /*
     * Stage 15
     */
    {
        $limit: 25
    }

]);