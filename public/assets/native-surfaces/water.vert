#version 300 es

#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
#define UNITY_UNIFORM
#else
#define UNITY_UNIFORM uniform
#endif
#define UNITY_SUPPORTS_UNIFORM_LOCATION 0
#if UNITY_SUPPORTS_UNIFORM_LOCATION
#define UNITY_LOCATION(x) layout(location = x)
#define UNITY_BINDING(x) layout(binding = x, std140)
#else
#define UNITY_LOCATION(x)
#define UNITY_BINDING(x) layout(std140)
#endif
uniform 	vec4 _Time;
uniform 	vec3 _WorldSpaceCameraPos;
uniform 	vec4 _ProjectionParams;
uniform 	mediump vec4 unity_SHAr;
uniform 	mediump vec4 unity_SHAg;
uniform 	mediump vec4 unity_SHAb;
uniform 	mediump vec4 unity_SHBr;
uniform 	mediump vec4 unity_SHBg;
uniform 	mediump vec4 unity_SHBb;
uniform 	mediump vec4 unity_SHC;
uniform 	vec4 hlslcc_mtx4x4unity_ObjectToWorld[4];
uniform 	vec4 hlslcc_mtx4x4unity_WorldToObject[4];
uniform 	vec4 hlslcc_mtx4x4unity_MatrixVP[4];
uniform 	float _FogStart;
uniform 	float _FogRcpRange;
uniform 	mediump vec4 _SkyboxTopColor;
uniform 	mediump vec4 _SkyboxHorizonColor;
uniform 	mediump vec4 _SkyboxBottomColor;
uniform 	float _FogEditorMultiplier;
uniform 	float _WaveAmplitude;
uniform 	float _WaveSpeed;
uniform 	float _FlowChaos;
in highp vec4 in_POSITION0;
in highp vec3 in_NORMAL0;
highp vec3 vs_TEXCOORD0;
out mediump vec3 vs_TEXCOORD1;
out highp vec4 vs_TEXCOORD2;
out mediump vec3 vs_TEXCOORD3;
out mediump vec2 vs_TEXCOORD4;
out mediump vec4 vs_TEXCOORD5;
out mediump vec3 vs_TEXCOORD6;
vec4 u_xlat0;
vec4 u_xlat1;
mediump vec4 u_xlat16_1;
vec4 u_xlat2;
vec3 u_xlat3;
vec2 u_xlat4;
float u_xlat5;
vec2 u_xlat6;
vec2 u_xlat7;
vec4 u_xlat8;
float u_xlat9;
mediump vec3 u_xlat16_10;
mediump vec3 u_xlat16_11;
float u_xlat12;
mediump float u_xlat16_12;
float u_xlat13;
mediump vec3 u_xlat16_22;
float u_xlat24;
bool u_xlatb24;
vec2 u_xlat25;
float u_xlat36;
float u_xlat37;
void main()
{
    u_xlat0.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);
    u_xlat0.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);
    u_xlat0.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);
    u_xlat36 = dot(u_xlat0.xyz, u_xlat0.xyz);
    u_xlat36 = inversesqrt(u_xlat36);
    u_xlat0.xyz = vec3(u_xlat36) * u_xlat0.xyz;
    u_xlat36 = u_xlat0.y;
    u_xlat36 = clamp(u_xlat36, 0.0, 1.0);
    u_xlat36 = (-u_xlat36) + 1.0;
    u_xlat36 = u_xlat36 * 5.0;
    u_xlat36 = min(u_xlat36, 1.0);
    u_xlat1.x = u_xlat36 * -2.0 + 3.0;
    u_xlat36 = u_xlat36 * u_xlat36;
    u_xlat1.x = u_xlat36 * u_xlat1.x;
    u_xlat36 = _Time.y * _WaveSpeed;
    u_xlat25.xy = vec2(u_xlat36) * vec2(0.699999988, 0.400000006);
    u_xlat2.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;
    u_xlat2.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat2.xyz;
    u_xlat2.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat2.xyz;
    u_xlat2.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat2.xyz;
    u_xlat25.xy = u_xlat2.xz * vec2(1.5, 1.5) + u_xlat25.xy;
    u_xlat3.xy = sin(u_xlat25.xy);
    u_xlat4.xy = cos(u_xlat25.xy);
    u_xlat25.x = u_xlat3.x + u_xlat4.y;
    u_xlat37 = (-u_xlat2.z) + u_xlat2.x;
    u_xlat37 = u_xlat36 * 0.5 + u_xlat37;
    u_xlat3.x = sin(u_xlat37);
    u_xlat5 = cos(u_xlat37);
    u_xlat25.x = u_xlat25.x + u_xlat3.x;
    u_xlat3.xz = u_xlat2.xz * vec2(0.5, 0.5);
    u_xlat6.xy = sin(u_xlat3.xz);
    u_xlat7.xy = cos(u_xlat3.xz);
    u_xlat37 = u_xlat6.x + u_xlat7.y;
    u_xlat25.x = u_xlat25.x * _FlowChaos + u_xlat37;
    u_xlat37 = u_xlat25.x * 0.100000001 + u_xlat2.y;
    u_xlat25.x = u_xlat25.x + u_xlat2.y;
    u_xlat25.x = u_xlat36 * 10.0 + u_xlat25.x;
    u_xlat3.x = sin(u_xlat25.x);
    u_xlat6.x = cos(u_xlat25.x);
    u_xlat25.x = u_xlat2.z + u_xlat2.x;
    u_xlat25.x = u_xlat25.x * 0.300000012;
    u_xlat25.x = u_xlat37 * 10.0 + u_xlat25.x;
    u_xlat36 = u_xlat36 * 4.0 + u_xlat25.x;
    u_xlat8.x = sin(u_xlat36);
    u_xlat9 = cos(u_xlat36);
    u_xlat36 = u_xlat3.x + (-u_xlat8.x);
    u_xlat36 = u_xlat1.x * u_xlat36 + u_xlat8.x;
    u_xlat1.y = u_xlat36 * 0.5 + 0.5;
    u_xlat2.w = u_xlat1.y * _WaveAmplitude + u_xlat2.y;
    vs_TEXCOORD4.xy = u_xlat1.xy;
    u_xlat8 = u_xlat2.wwww * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat8 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat2.xxxx + u_xlat8;
    u_xlat8 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat2.zzzz + u_xlat8;
    u_xlat8 = u_xlat8 + hlslcc_mtx4x4unity_MatrixVP[3];
    gl_Position = u_xlat8;
    vs_TEXCOORD0.xyz = u_xlat2.xwz;
    u_xlat36 = u_xlat4.x * 1.5 + u_xlat5;
    u_xlat13 = u_xlat3.y * -1.5 + (-u_xlat5);
    u_xlat13 = u_xlat13 * _FlowChaos;
    u_xlat13 = u_xlat6.y * -0.5 + u_xlat13;
    u_xlat36 = u_xlat36 * _FlowChaos;
    u_xlat36 = u_xlat7.x * 0.5 + u_xlat36;
    u_xlat25.x = u_xlat36 + 0.300000012;
    u_xlat25.x = u_xlat25.x * u_xlat9;
    u_xlat36 = u_xlat6.x * u_xlat36 + (-u_xlat25.x);
    u_xlat36 = u_xlat1.x * u_xlat36 + u_xlat25.x;
    u_xlat36 = u_xlat36 * _WaveAmplitude;
    u_xlat36 = u_xlat36 * 0.5;
    u_xlat3.x = (-u_xlat36);
    u_xlat36 = u_xlat13 + 0.300000012;
    u_xlat36 = u_xlat36 * u_xlat9;
    u_xlat13 = u_xlat6.x * u_xlat13 + (-u_xlat36);
    u_xlat36 = u_xlat1.x * u_xlat13 + u_xlat36;
    u_xlat1.x = u_xlat1.x * 2.0 + 2.0;
    u_xlat36 = u_xlat36 * _WaveAmplitude;
    u_xlat36 = u_xlat36 * 0.5;
    u_xlat3.z = (-u_xlat36);
    u_xlat3.y = 0.0;
    u_xlat0.xyz = u_xlat3.xyz * u_xlat1.xxx + u_xlat0.xyz;
    u_xlat36 = dot(u_xlat0.xyz, u_xlat0.xyz);
    u_xlat36 = inversesqrt(u_xlat36);
    u_xlat0.xyz = vec3(u_xlat36) * u_xlat0.xyz;
    vs_TEXCOORD1.xyz = u_xlat0.xyz;
    u_xlat1.x = u_xlat8.y * _ProjectionParams.x;
    u_xlat1.w = u_xlat1.x * 0.5;
    u_xlat1.xz = u_xlat8.xw * vec2(0.5, 0.5);
    vs_TEXCOORD2.zw = u_xlat8.zw;
    vs_TEXCOORD2.xy = u_xlat1.zz + u_xlat1.xw;
    u_xlat16_10.x = u_xlat0.y * u_xlat0.y;
    u_xlat16_10.x = u_xlat0.x * u_xlat0.x + (-u_xlat16_10.x);
    u_xlat16_1 = u_xlat0.yzzx * u_xlat0.xyzz;
    u_xlat16_11.x = dot(unity_SHBr, u_xlat16_1);
    u_xlat16_11.y = dot(unity_SHBg, u_xlat16_1);
    u_xlat16_11.z = dot(unity_SHBb, u_xlat16_1);
    u_xlat16_10.xyz = unity_SHC.xyz * u_xlat16_10.xxx + u_xlat16_11.xyz;
    u_xlat0.w = 1.0;
    u_xlat16_11.x = dot(unity_SHAr, u_xlat0);
    u_xlat16_11.y = dot(unity_SHAg, u_xlat0);
    u_xlat16_11.z = dot(unity_SHAb, u_xlat0);
    vs_TEXCOORD3.xyz = u_xlat16_10.xyz + u_xlat16_11.xyz;
    u_xlat0.xyz = u_xlat2.xwz + (-_WorldSpaceCameraPos.xyz);
    u_xlat2.xyz = (-u_xlat2.xwz) + _WorldSpaceCameraPos.xyz;
    u_xlat0.x = dot(u_xlat0.xyz, u_xlat0.xyz);
    u_xlat24 = inversesqrt(u_xlat0.x);
    u_xlat0.x = u_xlat0.x * u_xlat24 + (-_FogStart);
    u_xlat16_12 = u_xlat24 * u_xlat0.y;
    u_xlat0.x = u_xlat0.x * _FogRcpRange;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlatb24 = 0.0<u_xlat16_12;
    u_xlat16_10.x = -abs(u_xlat16_12) + 1.0;
    u_xlat16_22.xyz = (bool(u_xlatb24)) ? _SkyboxTopColor.xyz : _SkyboxBottomColor.xyz;
    u_xlat16_11.x = u_xlat16_10.x * u_xlat16_10.x;
    u_xlat16_10.x = (-u_xlat16_11.x) * u_xlat16_10.x + 1.0;
    u_xlat16_11.x = (-u_xlat16_10.x) + 1.0;
    u_xlat16_11.xyz = u_xlat16_11.xxx * _SkyboxHorizonColor.xyz;
    vs_TEXCOORD5.xyz = u_xlat16_22.xyz * u_xlat16_10.xxx + u_xlat16_11.xyz;
    u_xlat12 = u_xlat0.x * u_xlat0.x;
    u_xlat0.x = (-u_xlat0.x) * 2.0 + 3.0;
    u_xlat0.x = u_xlat0.x * u_xlat12;
    u_xlat0.x = u_xlat0.x * _FogEditorMultiplier;
    vs_TEXCOORD5.w = u_xlat0.x;
    u_xlat0.x = dot(u_xlat2.xyz, u_xlat2.xyz);
    u_xlat0.x = inversesqrt(u_xlat0.x);
    u_xlat0.xyz = u_xlat0.xxx * u_xlat2.xyz;
    vs_TEXCOORD6.xyz = u_xlat0.xyz;
    return;
}
