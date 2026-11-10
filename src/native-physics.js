// Runtime configuration. See docs/DEVELOPMENT.md.
export const NATIVE = {
  "mass": 300,
  "bodyDamping": 0.05000000074505806,
  "maxSpeed": 50,
  "minSteerAngle": 2,
  "maxSteerAngle": 20,
  "speedForMinSteer": 31.29191017150879,
  "stopSpeedThreshold": 1,
  "extraStopDrag": 2.5,
  "stopCompleteSpeed": 0,
  "minPull": 1,
  "maxPull": 3,
  "carStages": {
    "frontWheelsFirstFalse": [
      {
        "name": "default",
        "damping": 0.20000000298023224,
        "sourceTier": 0,
        "wheels": "both"
      },
      {
        "name": "basic wheels",
        "damping": 0.20000000298023224,
        "sourceTier": 1,
        "wheels": "both"
      },
      {
        "name": "bodywork",
        "damping": 0.10000000149011612,
        "sourceTier": 2,
        "wheels": "both"
      },
      {
        "name": "gold wheels",
        "damping": 0.029999999329447746,
        "sourceTier": 3,
        "wheels": "both"
      },
      {
        "name": "spoiler",
        "damping": 0.004999999888241291,
        "sourceTier": 4,
        "wheels": "both"
      },
      {
        "name": "engine",
        "damping": 0,
        "sourceTier": 5,
        "wheels": "both"
      }
    ],
    "frontWheelsFirstTrue": [
      {
        "name": "default",
        "damping": 0.20000000298023224,
        "sourceTier": 0,
        "wheels": "both"
      },
      {
        "name": "basic wheels (front only)",
        "damping": 0.20000000298023224,
        "sourceTier": 1,
        "wheels": "front"
      },
      {
        "name": "basic wheels",
        "damping": 0.20000000298023224,
        "sourceTier": 1,
        "wheels": "both"
      },
      {
        "name": "bodywork",
        "damping": 0.10000000149011612,
        "sourceTier": 2,
        "wheels": "both"
      },
      {
        "name": "gold wheels (front only)",
        "damping": 0.06500000040978193,
        "sourceTier": 3,
        "wheels": "front"
      },
      {
        "name": "gold wheels",
        "damping": 0.029999999329447746,
        "sourceTier": 3,
        "wheels": "both"
      },
      {
        "name": "spoiler",
        "damping": 0.004999999888241291,
        "sourceTier": 4,
        "wheels": "both"
      },
      {
        "name": "engine",
        "damping": 0,
        "sourceTier": 5,
        "wheels": "both"
      }
    ]
  },
  "rows": [
    {
      "purchasesOrPowerCount": 0,
      "carFalse": {
        "stageIndex": 0,
        "name": "default",
        "groundSpeedDamping": 0.2
      },
      "carTrue": {
        "stageIndex": 0,
        "name": "default",
        "groundSpeedDamping": 0.2
      },
      "slingshotForce": 12500
    },
    {
      "purchasesOrPowerCount": 1,
      "carFalse": {
        "stageIndex": 0,
        "name": "default",
        "groundSpeedDamping": 0.185
      },
      "carTrue": {
        "stageIndex": 0,
        "name": "default",
        "groundSpeedDamping": 0.185
      },
      "slingshotForce": 13250
    },
    {
      "purchasesOrPowerCount": 2,
      "carFalse": {
        "stageIndex": 0,
        "name": "default",
        "groundSpeedDamping": 0.17
      },
      "carTrue": {
        "stageIndex": 0,
        "name": "default",
        "groundSpeedDamping": 0.17
      },
      "slingshotForce": 14000
    },
    {
      "purchasesOrPowerCount": 3,
      "carFalse": {
        "stageIndex": 0,
        "name": "default",
        "groundSpeedDamping": 0.155
      },
      "carTrue": {
        "stageIndex": 0,
        "name": "default",
        "groundSpeedDamping": 0.155
      },
      "slingshotForce": 14750
    },
    {
      "purchasesOrPowerCount": 4,
      "carFalse": {
        "stageIndex": 0,
        "name": "default",
        "groundSpeedDamping": 0.14
      },
      "carTrue": {
        "stageIndex": 0,
        "name": "default",
        "groundSpeedDamping": 0.14
      },
      "slingshotForce": 15500
    },
    {
      "purchasesOrPowerCount": 5,
      "carFalse": {
        "stageIndex": 1,
        "name": "basic wheels",
        "groundSpeedDamping": 0.20000000298023224
      },
      "carTrue": {
        "stageIndex": 1,
        "name": "basic wheels (front only)",
        "groundSpeedDamping": 0.20000000298023224
      },
      "slingshotForce": 20000
    },
    {
      "purchasesOrPowerCount": 6,
      "carFalse": {
        "stageIndex": 1,
        "name": "basic wheels",
        "groundSpeedDamping": 0.19000000283122062
      },
      "carTrue": {
        "stageIndex": 1,
        "name": "basic wheels (front only)",
        "groundSpeedDamping": 0.20000000298023224
      },
      "slingshotForce": 21000
    },
    {
      "purchasesOrPowerCount": 7,
      "carFalse": {
        "stageIndex": 1,
        "name": "basic wheels",
        "groundSpeedDamping": 0.180000002682209
      },
      "carTrue": {
        "stageIndex": 1,
        "name": "basic wheels (front only)",
        "groundSpeedDamping": 0.20000000298023224
      },
      "slingshotForce": 22000
    },
    {
      "purchasesOrPowerCount": 8,
      "carFalse": {
        "stageIndex": 1,
        "name": "basic wheels",
        "groundSpeedDamping": 0.17000000253319741
      },
      "carTrue": {
        "stageIndex": 1,
        "name": "basic wheels (front only)",
        "groundSpeedDamping": 0.20000000298023224
      },
      "slingshotForce": 23000
    },
    {
      "purchasesOrPowerCount": 9,
      "carFalse": {
        "stageIndex": 1,
        "name": "basic wheels",
        "groundSpeedDamping": 0.1600000023841858
      },
      "carTrue": {
        "stageIndex": 1,
        "name": "basic wheels (front only)",
        "groundSpeedDamping": 0.20000000298023224
      },
      "slingshotForce": 24000
    },
    {
      "purchasesOrPowerCount": 10,
      "carFalse": {
        "stageIndex": 2,
        "name": "bodywork",
        "groundSpeedDamping": 0.10000000149011612
      },
      "carTrue": {
        "stageIndex": 2,
        "name": "basic wheels",
        "groundSpeedDamping": 0.20000000298023224
      },
      "slingshotForce": 30000
    },
    {
      "purchasesOrPowerCount": 11,
      "carFalse": {
        "stageIndex": 2,
        "name": "bodywork",
        "groundSpeedDamping": 0.09300000127404928
      },
      "carTrue": {
        "stageIndex": 2,
        "name": "basic wheels",
        "groundSpeedDamping": 0.19000000283122062
      },
      "slingshotForce": 31000
    },
    {
      "purchasesOrPowerCount": 12,
      "carFalse": {
        "stageIndex": 2,
        "name": "bodywork",
        "groundSpeedDamping": 0.08600000105798244
      },
      "carTrue": {
        "stageIndex": 2,
        "name": "basic wheels",
        "groundSpeedDamping": 0.180000002682209
      },
      "slingshotForce": 32000
    },
    {
      "purchasesOrPowerCount": 13,
      "carFalse": {
        "stageIndex": 2,
        "name": "bodywork",
        "groundSpeedDamping": 0.07900000084191561
      },
      "carTrue": {
        "stageIndex": 2,
        "name": "basic wheels",
        "groundSpeedDamping": 0.17000000253319741
      },
      "slingshotForce": 33000
    },
    {
      "purchasesOrPowerCount": 14,
      "carFalse": {
        "stageIndex": 2,
        "name": "bodywork",
        "groundSpeedDamping": 0.07200000062584877
      },
      "carTrue": {
        "stageIndex": 2,
        "name": "basic wheels",
        "groundSpeedDamping": 0.1600000023841858
      },
      "slingshotForce": 34000
    },
    {
      "purchasesOrPowerCount": 15,
      "carFalse": {
        "stageIndex": 3,
        "name": "gold wheels",
        "groundSpeedDamping": 0.029999999329447746
      },
      "carTrue": {
        "stageIndex": 3,
        "name": "bodywork",
        "groundSpeedDamping": 0.10000000149011612
      },
      "slingshotForce": 40000
    },
    {
      "purchasesOrPowerCount": 16,
      "carFalse": {
        "stageIndex": 3,
        "name": "gold wheels",
        "groundSpeedDamping": 0.0274999993853271
      },
      "carTrue": {
        "stageIndex": 3,
        "name": "bodywork",
        "groundSpeedDamping": 0.0965000013820827
      },
      "slingshotForce": 41000
    },
    {
      "purchasesOrPowerCount": 17,
      "carFalse": {
        "stageIndex": 3,
        "name": "gold wheels",
        "groundSpeedDamping": 0.024999999441206455
      },
      "carTrue": {
        "stageIndex": 3,
        "name": "bodywork",
        "groundSpeedDamping": 0.09300000127404928
      },
      "slingshotForce": 42000
    },
    {
      "purchasesOrPowerCount": 18,
      "carFalse": {
        "stageIndex": 3,
        "name": "gold wheels",
        "groundSpeedDamping": 0.02249999949708581
      },
      "carTrue": {
        "stageIndex": 3,
        "name": "bodywork",
        "groundSpeedDamping": 0.08950000116601586
      },
      "slingshotForce": 43000
    },
    {
      "purchasesOrPowerCount": 19,
      "carFalse": {
        "stageIndex": 3,
        "name": "gold wheels",
        "groundSpeedDamping": 0.019999999552965164
      },
      "carTrue": {
        "stageIndex": 3,
        "name": "bodywork",
        "groundSpeedDamping": 0.08600000105798244
      },
      "slingshotForce": 44000
    },
    {
      "purchasesOrPowerCount": 20,
      "carFalse": {
        "stageIndex": 4,
        "name": "spoiler",
        "groundSpeedDamping": 0.004999999888241291
      },
      "carTrue": {
        "stageIndex": 4,
        "name": "gold wheels (front only)",
        "groundSpeedDamping": 0.06500000040978193
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 21,
      "carFalse": {
        "stageIndex": 4,
        "name": "spoiler",
        "groundSpeedDamping": 0.004499999899417162
      },
      "carTrue": {
        "stageIndex": 4,
        "name": "gold wheels (front only)",
        "groundSpeedDamping": 0.061500000301748514
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 22,
      "carFalse": {
        "stageIndex": 4,
        "name": "spoiler",
        "groundSpeedDamping": 0.003999999910593033
      },
      "carTrue": {
        "stageIndex": 4,
        "name": "gold wheels (front only)",
        "groundSpeedDamping": 0.058000000193715096
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 23,
      "carFalse": {
        "stageIndex": 4,
        "name": "spoiler",
        "groundSpeedDamping": 0.0034999999217689036
      },
      "carTrue": {
        "stageIndex": 4,
        "name": "gold wheels (front only)",
        "groundSpeedDamping": 0.05450000008568168
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 24,
      "carFalse": {
        "stageIndex": 4,
        "name": "spoiler",
        "groundSpeedDamping": 0.0029999999329447745
      },
      "carTrue": {
        "stageIndex": 4,
        "name": "gold wheels (front only)",
        "groundSpeedDamping": 0.05099999997764826
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 25,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 5,
        "name": "gold wheels",
        "groundSpeedDamping": 0.029999999329447746
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 26,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 5,
        "name": "gold wheels",
        "groundSpeedDamping": 0.0274999993853271
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 27,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 5,
        "name": "gold wheels",
        "groundSpeedDamping": 0.024999999441206455
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 28,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 5,
        "name": "gold wheels",
        "groundSpeedDamping": 0.02249999949708581
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 29,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 5,
        "name": "gold wheels",
        "groundSpeedDamping": 0.019999999552965164
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 30,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 6,
        "name": "spoiler",
        "groundSpeedDamping": 0.004999999888241291
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 31,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 6,
        "name": "spoiler",
        "groundSpeedDamping": 0.004499999899417162
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 32,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 6,
        "name": "spoiler",
        "groundSpeedDamping": 0.003999999910593033
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 33,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 6,
        "name": "spoiler",
        "groundSpeedDamping": 0.0034999999217689036
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 34,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 6,
        "name": "spoiler",
        "groundSpeedDamping": 0.0029999999329447745
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 35,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 7,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 36,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 7,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 37,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 7,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 38,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 7,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 39,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 7,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "slingshotForce": 50000
    },
    {
      "purchasesOrPowerCount": 40,
      "carFalse": {
        "stageIndex": 5,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "carTrue": {
        "stageIndex": 7,
        "name": "engine",
        "groundSpeedDamping": 0
      },
      "slingshotForce": 50000
    }
  ]
};
