// Runtime configuration. See docs/DEVELOPMENT.md.
export const DYNAMICS = {
  "mass": 300,
  "linearDamping": 0.05000000074505806,
  "angularDamping": 1,
  "centerOfMass": [
    0,
    0.05000000074505806,
    -0.05999999865889549
  ],
  "minSteerAngle": 2,
  "maxSteerAngle": 20,
  "speedForMinSteer": 31.29191017150879,
  "airTorque": 5000,
  "wheel": {
    "class": "ReplicaWheel",
    "gameObject": "chevy wheel",
    "file": "sharedassets0.assets",
    "pathId": 1177,
    "size": 132,
    "out": "ReplicaWheel-sharedassets0.assets-1177.bin",
    "center": [
      0,
      0,
      0
    ],
    "radius": 0.42500001192092896,
    "suspensionDistance": 0.25,
    "forceAppPointDistance": 0,
    "mass": 20,
    "wheelDampingRate": 0.25,
    "suspensionSpring": {
      "spring": 7500,
      "damper": 1250,
      "targetPosition": 0.10000000149011612
    },
    "forwardFriction": {
      "extremumSlip": 0.4000000059604645,
      "extremumValue": 1,
      "asymptoteSlip": 0.800000011920929,
      "asymptoteValue": 0.5,
      "stiffness": 1
    },
    "sidewaysFriction": {
      "extremumSlip": 0.20000000298023224,
      "extremumValue": 1,
      "asymptoteSlip": 0.5,
      "asymptoteValue": 0.75,
      "stiffness": 1.25
    },
    "includeLayers": 0,
    "excludeLayers": 0,
    "layerOverridePriority": 0,
    "providesContacts": false,
    "parsedThroughObjectByte": "0x84"
  },
  "wheelPositions": [
    {
      "node": 7,
      "name": "rear left",
      "translation": [
        0.85,
        0.050000012,
        -1.4
      ],
      "rotation": [
        0,
        -1,
        0,
        0
      ]
    },
    {
      "node": 8,
      "name": "front left",
      "translation": [
        0.85,
        0.050000012,
        1.46
      ],
      "rotation": [
        0,
        -1,
        0,
        0
      ]
    },
    {
      "node": 9,
      "name": "rear right",
      "translation": [
        -0.85,
        0.050000012,
        -1.4
      ],
      "rotation": [
        0,
        0,
        0,
        1
      ]
    },
    {
      "node": 10,
      "name": "front right",
      "translation": [
        -0.85,
        0.050000012,
        1.46
      ],
      "rotation": [
        0,
        0,
        0,
        1
      ]
    }
  ],
  "colliderBounds": [
    {
      "min": [
        -0.9938776,
        -0.2439204,
        -2.3662834
      ],
      "max": [
        0.9938776,
        1.0718228,
        2.3304066
      ]
    },
    {
      "min": [
        -0.9453788,
        -0.0728854,
        -1.856021
      ],
      "max": [
        0.945376,
        1.0250912,
        1.6824682
      ]
    },
    {
      "min": [
        -0.9453788,
        -0.0728854,
        -1.856021
      ],
      "max": [
        0.945376,
        1.0250912,
        1.6824682
      ]
    },
    {
      "min": [
        -0.9453788,
        -0.0728854,
        -1.856021
      ],
      "max": [
        0.945376,
        1.0250912,
        1.6824682
      ]
    },
    {
      "min": [
        -0.9453788,
        -0.0728854,
        -1.856021
      ],
      "max": [
        0.945376,
        1.0250912,
        1.6824682
      ]
    },
    {
      "min": [
        -0.9453788,
        -0.0728854,
        -1.856021
      ],
      "max": [
        0.945376,
        1.0250912,
        1.6824682
      ]
    }
  ],
  "geometrySpace": "GLB root-local units, matching wheel anchors and visible car. Original prefab scale .5 is not applied by the existing GLB runtime. Native world spawn scale is unresolved; bounds only used by experiments."
};
