#version 300 es
#ifdef GL_EXT_shader_texture_lod
#extension GL_EXT_shader_texture_lod : enable
#endif

precision highp float;
precision highp int;
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
uniform 	vec3 _WorldSpaceCameraPos;
uniform 	mediump vec4 _WorldSpaceLightPos0;
uniform 	mediump vec4 _LightColor0;
uniform 	vec2 _DynamicShadowEdgeFadeInvWidth;
uniform 	mediump vec4 _Color1;
uniform 	mediump vec4 _Color2;
uniform 	float _TopTiling;
uniform 	mediump float _Glossiness;
uniform 	mediump float _FogStrength;
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
UNITY_LOCATION(1) uniform highp sampler2D _StaticShadowMap;
UNITY_LOCATION(2) uniform highp sampler2DShadow hlslcc_zcmp_StaticShadowMap;
UNITY_LOCATION(3) uniform highp sampler2D _DynamicShadowMap;
UNITY_LOCATION(4) uniform highp sampler2DShadow hlslcc_zcmp_DynamicShadowMap;
in highp  vec3 vs_TEXCOORD0;
in mediump  vec3 vs_TEXCOORD1;
in mediump  vec3 vs_TEXCOORD2;
in mediump  vec4 vs_TEXCOORD3;
in highp  vec4 vs_TEXCOORD4;
in highp  vec4 vs_TEXCOORD5;
layout(location = 0) out mediump vec4 SV_Target0;
vec2 u_xlat0;
mediump vec4 u_xlat16_0;
bvec3 u_xlatb0;
vec4 u_xlat1;
mediump float u_xlat16_1;
bool u_xlatb1;
mediump vec3 u_xlat16_2;
mediump vec3 u_xlat16_3;
float u_xlat4;
mediump vec3 u_xlat16_5;
vec3 u_xlat6;
vec3 u_xlat7;
vec2 u_xlat11;
float u_xlat18;
mediump float u_xlat16_18;
bool u_xlatb18;
mediump float u_xlat16_23;
mediump float u_xlat16_24;
mediump float u_xlat16_26;
void main()
{
    u_xlatb0.xyz = lessThan(abs(vs_TEXCOORD1.xzzx), abs(vs_TEXCOORD1.yyxy)).xyz;
    u_xlatb0.x = u_xlatb0.y && u_xlatb0.x;
    u_xlat1 = vs_TEXCOORD0.xzzy * vec4(_TopTiling);
    u_xlat7.xz = vs_TEXCOORD0.xy * vec2(_TopTiling);
    u_xlat7.xy = (u_xlatb0.z) ? u_xlat1.zw : u_xlat7.xz;
    u_xlat0.xy = (u_xlatb0.x) ? u_xlat1.xy : u_xlat7.xy;
    u_xlat16_0.xw = texture(_MainTex, u_xlat0.xy).xw;
    u_xlat16_2.xyz = (-_Color1.xyz) + _Color2.xyz;
    u_xlat16_2.xyz = u_xlat16_0.xxx * u_xlat16_2.xyz + _Color1.xyz;
    u_xlat16_23 = dot(vs_TEXCOORD1.xyz, vs_TEXCOORD1.xyz);
    u_xlat16_23 = inversesqrt(u_xlat16_23);
    u_xlat16_3.xyz = vec3(u_xlat16_23) * vs_TEXCOORD1.xyz;
    u_xlat16_23 = dot(u_xlat16_3.xyz, _WorldSpaceLightPos0.xyz);
    u_xlat16_23 = clamp(u_xlat16_23, 0.0, 1.0);
    u_xlatb1 = 9.99999975e-05<vs_TEXCOORD4.w;
    if(u_xlatb1){
        vec3 txVec0 = vec3(vs_TEXCOORD4.xy,vs_TEXCOORD4.z);
        u_xlat1.x = textureLod(hlslcc_zcmp_StaticShadowMap, txVec0, 0.0);
        u_xlat16_1 = u_xlat1.x;
    } else {
        u_xlat16_1 = 1.0;
    }
    u_xlat4 = u_xlat16_1 + -1.0;
    u_xlat4 = vs_TEXCOORD4.w * u_xlat4 + 1.0;
    u_xlat11.xy = vs_TEXCOORD5.xy + vec2(-0.5, -0.5);
    u_xlat11.xy = -abs(u_xlat11.xy) + vec2(0.5, 0.5);
    u_xlat16_5.xy = u_xlat11.xy * _DynamicShadowEdgeFadeInvWidth.xy;
    u_xlat16_5.xy = clamp(u_xlat16_5.xy, 0.0, 1.0);
    u_xlat11.x = u_xlat16_5.x * vs_TEXCOORD5.w;
    u_xlat11.x = u_xlat16_5.y * u_xlat11.x;
    u_xlatb18 = 9.99999975e-05<u_xlat11.x;
    if(u_xlatb18){
        vec3 txVec1 = vec3(vs_TEXCOORD5.xy,vs_TEXCOORD5.z);
        u_xlat18 = textureLod(hlslcc_zcmp_DynamicShadowMap, txVec1, 0.0);
        u_xlat16_18 = u_xlat18;
    } else {
        u_xlat16_18 = 1.0;
    }
    u_xlat6.x = u_xlat16_18 + -1.0;
    u_xlat6.x = u_xlat11.x * u_xlat6.x + 1.0;
    u_xlat16_24 = u_xlat4 * u_xlat6.x;
    u_xlat6.xyz = (-vs_TEXCOORD0.xyz) + _WorldSpaceCameraPos.xyz;
    u_xlat16_5.x = dot(u_xlat6.xyz, u_xlat6.xyz);
    u_xlat16_5.x = inversesqrt(u_xlat16_5.x);
    u_xlat16_5.xyz = u_xlat6.xyz * u_xlat16_5.xxx + _WorldSpaceLightPos0.xyz;
    u_xlat16_26 = dot(u_xlat16_5.xyz, u_xlat16_5.xyz);
    u_xlat16_26 = inversesqrt(u_xlat16_26);
    u_xlat16_5.xyz = vec3(u_xlat16_26) * u_xlat16_5.xyz;
    u_xlat16_3.x = dot(u_xlat16_3.xyz, u_xlat16_5.xyz);
    u_xlat16_3.x = clamp(u_xlat16_3.x, 0.0, 1.0);
    u_xlat16_3.x = u_xlat16_3.x * u_xlat16_3.x;
    u_xlat16_3.x = u_xlat16_3.x * u_xlat16_3.x;
    u_xlat16_3.x = u_xlat16_3.x * u_xlat16_3.x;
    u_xlat16_3.x = u_xlat16_3.x * u_xlat16_3.x;
    u_xlat16_3.x = u_xlat16_3.x * _Glossiness;
    u_xlat6.x = u_xlat16_3.x * 0.25;
    u_xlat16_23 = u_xlat16_23 * u_xlat16_24;
    u_xlat16_3.xyz = _LightColor0.xyz * vec3(u_xlat16_23) + vs_TEXCOORD2.xyz;
    u_xlat16_23 = u_xlat16_24 * u_xlat6.x;
    u_xlat16_5.xyz = vec3(u_xlat16_23) * _LightColor0.xyz;
    u_xlat16_2.xyz = u_xlat16_2.xyz * u_xlat16_3.xyz + u_xlat16_5.xyz;
    u_xlat16_23 = vs_TEXCOORD3.w * _FogStrength;
    u_xlat16_23 = clamp(u_xlat16_23, 0.0, 1.0);
    u_xlat6.xyz = (-u_xlat16_2.xyz) + vs_TEXCOORD3.xyz;
    u_xlat16_0.xyz = vec3(u_xlat16_23) * u_xlat6.xyz + u_xlat16_2.xyz;
    SV_Target0 = u_xlat16_0;
    return;
}
