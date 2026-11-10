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
uniform 	mediump vec4 _WorldSpaceLightPos0;
uniform 	mediump vec4 _LightColor0;
uniform 	vec2 _DynamicShadowEdgeFadeInvWidth;
uniform 	mediump vec4 _Color1;
uniform 	mediump vec4 _Color2;
uniform 	float _TopTiling;
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
UNITY_LOCATION(1) uniform highp sampler2D _StaticShadowMap;
UNITY_LOCATION(2) uniform highp sampler2DShadow hlslcc_zcmp_StaticShadowMap;
UNITY_LOCATION(3) uniform highp sampler2D _DynamicShadowMap;
UNITY_LOCATION(4) uniform highp sampler2DShadow hlslcc_zcmp_DynamicShadowMap;
in highp  vec3 vs_TEXCOORD0;
in mediump  vec3 vs_TEXCOORD1;
in mediump  vec3 vs_TEXCOORD2;
in mediump  vec4 vs_TEXCOORD4;
in highp  vec4 vs_TEXCOORD5;
in highp  vec4 vs_TEXCOORD6;
layout(location = 0) out mediump vec4 SV_Target0;
vec2 u_xlat0;
mediump vec4 u_xlat16_0;
bvec3 u_xlatb0;
vec4 u_xlat1;
mediump float u_xlat16_1;
bool u_xlatb1;
mediump vec3 u_xlat16_2;
float u_xlat3;
mediump vec3 u_xlat16_4;
vec3 u_xlat5;
vec3 u_xlat6;
vec3 u_xlat7;
vec2 u_xlat10;
mediump vec3 u_xlat16_11;
float u_xlat17;
mediump float u_xlat16_17;
bool u_xlatb17;
mediump float u_xlat16_23;
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
    u_xlat16_23 = dot(vs_TEXCOORD1.xyz, _WorldSpaceLightPos0.xyz);
    u_xlat16_23 = clamp(u_xlat16_23, 0.0, 1.0);
    u_xlatb1 = 9.99999975e-05<vs_TEXCOORD5.w;
    if(u_xlatb1){
        vec3 txVec0 = vec3(vs_TEXCOORD5.xy,vs_TEXCOORD5.z);
        u_xlat1.x = textureLod(hlslcc_zcmp_StaticShadowMap, txVec0, 0.0);
        u_xlat16_1 = u_xlat1.x;
    } else {
        u_xlat16_1 = 1.0;
    }
    u_xlat3 = u_xlat16_1 + -1.0;
    u_xlat3 = vs_TEXCOORD5.w * u_xlat3 + 1.0;
    u_xlat10.xy = vs_TEXCOORD6.xy + vec2(-0.5, -0.5);
    u_xlat10.xy = -abs(u_xlat10.xy) + vec2(0.5, 0.5);
    u_xlat16_4.xy = u_xlat10.xy * _DynamicShadowEdgeFadeInvWidth.xy;
    u_xlat16_4.xy = clamp(u_xlat16_4.xy, 0.0, 1.0);
    u_xlat10.x = u_xlat16_4.x * vs_TEXCOORD6.w;
    u_xlat10.x = u_xlat16_4.y * u_xlat10.x;
    u_xlatb17 = 9.99999975e-05<u_xlat10.x;
    if(u_xlatb17){
        vec3 txVec1 = vec3(vs_TEXCOORD6.xy,vs_TEXCOORD6.z);
        u_xlat17 = textureLod(hlslcc_zcmp_DynamicShadowMap, txVec1, 0.0);
        u_xlat16_17 = u_xlat17;
    } else {
        u_xlat16_17 = 1.0;
    }
    u_xlat5.x = u_xlat16_17 + -1.0;
    u_xlat5.x = u_xlat10.x * u_xlat5.x + 1.0;
    u_xlat16_4.x = u_xlat3 * u_xlat5.x;
    u_xlat16_11.xyz = u_xlat16_2.xyz * _LightColor0.xyz;
    u_xlat16_11.xyz = vec3(u_xlat16_23) * u_xlat16_11.xyz;
    u_xlat16_4.xyz = u_xlat16_4.xxx * u_xlat16_11.xyz;
    u_xlat5.xyz = u_xlat16_2.xyz * vs_TEXCOORD2.xyz + u_xlat16_4.xyz;
    u_xlat6.xyz = (-u_xlat5.xyz) + vs_TEXCOORD4.xyz;
    u_xlat16_0.xyz = vs_TEXCOORD4.www * u_xlat6.xyz + u_xlat5.xyz;
    SV_Target0 = u_xlat16_0;
    return;
}
