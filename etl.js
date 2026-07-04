import fs from "fs";
import csv from "csv-parser";
import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017");

const DB_NAME = "logistics_db";

const BATCH_SIZE = 1000;

async function run() {
  await client.connect();
  const db = client.db(DB_NAME);

  const shipmentsCol = db.collection("shipments");
  const eventsCol = db.collection("route_events");

  console.log("Connected to MongoDB");

  await new Promise((resolve, reject) => {
    const batch = [];

    fs.createReadStream("./shipment/shipments_master.csv")
      .pipe(csv())
      .on("data", async (row) => {
        batch.push({
          shipment_id: row.shipment_id,
          carrier: row.carrier,
          origin_port: row.origin_port,
          destination_port: row.destination_port,
          transport_mode: row.transport_mode,
          status: row.status,
          goods_category: row.goods_category,
          currency: row.currency,
          created_date: row.created_date,
          eta_date: row.eta_date,
          transit_hours: Number(row.transit_hours),
          distance_km: Number(row.distance_km),
          weight_kg: Number(row.weight_kg),
          volume_m3: Number(row.volume_m3),
          value_usd: Number(row.value_usd),
          freight_cost_usd: Number(row.freight_cost_usd),
          num_containers: Number(row.num_containers),
          num_stops: Number(row.num_stops),
          delay_hours: Number(row.delay_hours),
          risk_score: Number(row.risk_score),
          weather_severity: Number(row.weather_severity),
          port_congestion: Number(row.port_congestion),
          temperature_c: Number(row.temperature_c),
          priority_level: row.priority_level,
          insurance_required: row.insurance_required === "True"
        });

        if (batch.length >= BATCH_SIZE) {
          const toInsert = batch.splice(0, BATCH_SIZE);
          await shipmentsCol.insertMany(toInsert);
        }
      })
      .on("end", async () => {
        if (batch.length > 0) {
          await shipmentsCol.insertMany(batch);
        }
        console.log("Shipments imported");
        resolve();
      })
      .on("error", reject);
  });


  await new Promise((resolve, reject) => {
    const batch = [];

    fs.createReadStream("./shipment/route_events.csv")
      .pipe(csv())
      .on("data", async (row) => {
        batch.push({
          event_id: row.event_id,
          shipment_id: row.shipment_id,
          event_type: row.event_type,
          event_timestamp: new Date(row.event_timestamp),
          location_name: row.location_name,
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          speed_knots: Number(row.speed_knots),
          heading_deg: Number(row.heading_deg),
          temperature_c: Number(row.temperature_c),
          humidity_pct: Number(row.humidity_pct),
          shock_g: Number(row.shock_g),
          delay_added_hours: Number(row.delay_added_hours),
          risk_score_delta: Number(row.risk_score_delta),
          port_wait_hours: Number(row.port_wait_hours),
          fuel_consumed_lt: Number(row.fuel_consumed_lt),
          co2_kg: Number(row.co2_kg),
          sensor_type: row.sensor_type,
          signal_quality: row.signal_quality,
          anomaly_flag: row.anomaly_flag === "True",
          alert_sent: row.alert_sent === "True"
        });

        if (batch.length >= BATCH_SIZE) {
          const toInsert = batch.splice(0, BATCH_SIZE);
          await eventsCol.insertMany(toInsert);
        }
      })
      .on("end", async () => {
        if (batch.length > 0) {
          await eventsCol.insertMany(batch);
        }
        console.log("Route events imported");
        resolve();
      })
      .on("error", reject);
  });

  console.log("ETL finished successfully");

  await client.close();
}

run().catch(console.error);