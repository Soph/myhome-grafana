import * as fs from "fs";

import { MyHomeClient } from 'homebridge-myhome-tng/lib/mhclient';
import { InfluxDB, FieldType as InfluxFieldType } from 'influx';

class MyHomeMQTT {
    private client: MyHomeClient;
    private influx: InfluxDB;

    constructor(public config: any) {
        this.client = new MyHomeClient(config.myhome.host, config.myhome.port, config.myhome.password, null, this);
        
        this.influx = new InfluxDB({ 
                        host: config.influx.host,
                        database: config.influx.database,
                        username: config.influx.username,
                        password: config.influx.password,
                        protocol: config.influx.protocol,
                        schema: [{
                            measurement: 'thermostat',
                            fields: {
                                ambient: InfluxFieldType.FLOAT,
                                setpoint: InfluxFieldType.FLOAT
                            },
                            tags: [
                                'address', 'host'
                            ]
                        }]
                    });
        this.client.start();
    }

    public onMonitor(_frame) {
        console.log("onMonitor");
	}

    public onThermostat(address, type, value) {
        console.log("onThermostatCalled");
        if (type === 'AMBIENT') {
            this.influx.writeMeasurement("thermostat", [{
                tags: { address: address, host: this.config.myhome.host },
                fields: { ambient: value } 
            }]);    
        }
        if (type === 'SETPOINT') {
            this.influx.writeMeasurement("thermostat", [{
                tags: { address: address, host: this.config.myhome.host },
                fields: { setpoint: value } 
            }]);    
        } 
    } 
}

let configFile = process.argv[2];
if (!configFile) {
    configFile = "config.json";
}

let config = JSON.parse(fs.readFileSync(configFile, 'utf8').trim());
const mqtt = new MyHomeMQTT(config);