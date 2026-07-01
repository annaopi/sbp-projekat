db.shipments.createIndex({
    shipment_id: 1
});

db.route_events.createIndex({
    shipment_id: 1
});