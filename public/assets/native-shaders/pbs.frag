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
uniform 	mediump vec4 unity_SHAr;
uniform 	mediump vec4 unity_SHAg;
uniform 	mediump vec4 unity_SHAb;
uniform 	mediump vec4 unity_SpecCube0_HDR;
uniform 	mediump vec4 _LightColor0;
uniform 	mediump vec4 _Color;
uniform 	mediump float _Metallic;
uniform 	float _Glossiness;
uniform 	mediump vec4 _EmissionColor;
uniform 	vec4 hlslcc_mtx4x4_StaticShadowMatrix[4];
uniform 	float _StaticShadowDebugMode;
uniform 	vec2 _DynamicShadowEdgeFadeInvWidth;
uniform 	mediump vec4 _StarEmissionColor;
uniform 	mediump vec4 _StarRimParams;
UNITY_LOCATION(0) uniform mediump sampler2D _MainTex;
UNITY_LOCATION(1) uniform mediump sampler2D _EmissionMap;
UNITY_LOCATION(2) uniform mediump samplerCube unity_SpecCube0;
UNITY_LOCATION(3) uniform highp sampler2D _StaticShadowMap;
UNITY_LOCATION(4) uniform highp sampler2DShadow hlslcc_zcmp_StaticShadowMap;
UNITY_LOCATION(5) uniform highp sampler2D _DynamicShadowMap;
UNITY_LOCATION(6) uniform highp sampler2DShadow hlslcc_zcmp_DynamicShadowMap;
in highp  vec4 vs_TEXCOORD0;
in highp  vec4 vs_TEXCOORD1;
in highp  vec3 vs_TEXCOORD2;
in mediump  vec4 vs_TEXCOORD3;
in highp  vec4 vs_TEXCOORD4;
in mediump  vec4 vs_TEXCOORD5;
in highp  vec3 vs_TEXCOORD8;
in highp  vec4 vs_TEXCOORD9;
layout(location = 0) out mediump vec4 SV_Target0;
vec4 u_xlat0;
mediump vec3 u_xlat16_0;
bool u_xlatb0;
vec4 u_xlat1;
mediump vec3 u_xlat16_2;
mediump vec3 u_xlat16_3;
float u_xlat4;
mediump vec4 u_xlat16_4;
bool u_xlatb4;
float u_xlat5;
mediump vec3 u_xlat16_6;
vec3 u_xlat7;
mediump vec3 u_xlat16_8;
mediump vec3 u_xlat16_9;
mediump vec2 u_xlat16_10;
float u_xlat11;
mediump vec3 u_xlat16_11;
vec2 u_xlat12;
vec3 u_xlat13;
vec2 u_xlat17;
vec3 u_xlat19;
float u_xlat23;
float u_xlat25;
float u_xlat29;
mediump float u_xlat16_29;
bool u_xlatb29;
float u_xlat31;
float u_xlat36;
bool u_xlatb36;
mediump float u_xlat16_38;
mediump float u_xlat16_39;
float u_xlat43;
void main()
{
    u_xlatb0 = 0.5<_StaticShadowDebugMode;
    if(u_xlatb0){
        u_xlat0.xyz = vs_TEXCOORD8.yyy * hlslcc_mtx4x4_StaticShadowMatrix[1].xyz;
        u_xlat0.xyz = hlslcc_mtx4x4_StaticShadowMatrix[0].xyz * vs_TEXCOORD8.xxx + u_xlat0.xyz;
        u_xlat0.xyz = hlslcc_mtx4x4_StaticShadowMatrix[2].xyz * vs_TEXCOORD8.zzz + u_xlat0.xyz;
        u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4_StaticShadowMatrix[3].xyz;
        u_xlat1.xyw = u_xlat0.xyz * vec3(0.5, 0.5, 0.5) + vec3(0.5, 0.5, 0.5);
        u_xlat0.x = max(abs(u_xlat0.y), abs(u_xlat0.x));
        u_xlatb0 = 1.0>=u_xlat0.x;
        if(u_xlatb0){
            u_xlatb0 = _StaticShadowDebugMode>=1.5;
            if(u_xlatb0){
                u_xlatb0 = _StaticShadowDebugMode>=2.5;
                if(u_xlatb0){
                    vec3 txVec0 = vec3(u_xlat1.xy,u_xlat1.w);
                    u_xlat25 = textureLod(hlslcc_zcmp_StaticShadowMap, txVec0, 0.0);
                    u_xlat1.xyz = vec3(u_xlat25);
                } else {
                    u_xlat1.xyz = u_xlat1.www;
                }
            } else {
                u_xlat1.z = 0.0;
            }
        } else {
            u_xlat1.x = float(1.0);
            u_xlat1.y = float(0.0);
            u_xlat1.z = float(1.0);
        }
        SV_Target0.xyz = u_xlat1.xyz;
        SV_Target0.w = 1.0;
        return;
    }
    u_xlat16_0.xyz = texture(_MainTex, vs_TEXCOORD0.xy).xyz;
    u_xlat1.xyz = u_xlat16_0.xyz * _Color.xyz;
    u_xlat16_2.xyz = _Color.xyz * u_xlat16_0.xyz + vec3(-0.0399999991, -0.0399999991, -0.0399999991);
    u_xlat16_2.xyz = vec3(vec3(_Metallic, _Metallic, _Metallic)) * u_xlat16_2.xyz + vec3(0.0399999991, 0.0399999991, 0.0399999991);
    u_xlat16_38 = (-_Metallic) * 0.959999979 + 0.959999979;
    u_xlat16_3.xyz = u_xlat1.xyz * vec3(u_xlat16_38);
    u_xlat0.x = dot(vs_TEXCOORD2.xyz, vs_TEXCOORD2.xyz);
    u_xlat0.x = inversesqrt(u_xlat0.x);
    u_xlat0.xyz = u_xlat0.xxx * vs_TEXCOORD2.xyz;
    u_xlat1.x = dot(vs_TEXCOORD1.xyz, vs_TEXCOORD1.xyz);
    u_xlat1.x = inversesqrt(u_xlat1.x);
    u_xlat13.xyz = u_xlat1.xxx * vs_TEXCOORD1.xyz;
    u_xlatb4 = 9.99999975e-05<vs_TEXCOORD4.w;
    if(u_xlatb4){
        vec3 txVec1 = vec3(vs_TEXCOORD4.xy,vs_TEXCOORD4.z);
        u_xlat4 = textureLod(hlslcc_zcmp_StaticShadowMap, txVec1, 0.0);
        u_xlat16_4.x = u_xlat4;
    } else {
        u_xlat16_4.x = 1.0;
    }
    u_xlat5 = u_xlat16_4.x + -1.0;
    u_xlat5 = vs_TEXCOORD4.w * u_xlat5 + 1.0;
    u_xlat17.xy = vs_TEXCOORD9.xy + vec2(-0.5, -0.5);
    u_xlat17.xy = -abs(u_xlat17.xy) + vec2(0.5, 0.5);
    u_xlat16_6.xy = u_xlat17.xy * _DynamicShadowEdgeFadeInvWidth.xy;
    u_xlat16_6.xy = clamp(u_xlat16_6.xy, 0.0, 1.0);
    u_xlat17.x = u_xlat16_6.x * vs_TEXCOORD9.w;
    u_xlat17.x = u_xlat16_6.y * u_xlat17.x;
    u_xlatb29 = 9.99999975e-05<u_xlat17.x;
    if(u_xlatb29){
        vec3 txVec2 = vec3(vs_TEXCOORD9.xy,vs_TEXCOORD9.z);
        u_xlat29 = textureLod(hlslcc_zcmp_DynamicShadowMap, txVec2, 0.0);
        u_xlat16_29 = u_xlat29;
    } else {
        u_xlat16_29 = 1.0;
    }
    u_xlat7.x = u_xlat16_29 + -1.0;
    u_xlat7.x = u_xlat17.x * u_xlat7.x + 1.0;
    u_xlat16_39 = u_xlat5 * u_xlat7.x;
    u_xlat7.x = (-_Glossiness) + 1.0;
    u_xlat16_6.x = dot(u_xlat13.xyz, u_xlat0.xyz);
    u_xlat16_6.x = u_xlat16_6.x + u_xlat16_6.x;
    u_xlat16_6.xyz = u_xlat0.xyz * (-u_xlat16_6.xxx) + u_xlat13.xyz;
    u_xlat16_8.xyz = vec3(u_xlat16_39) * _LightColor0.xyz;
    u_xlat0.w = 1.0;
    u_xlat16_9.x = dot(unity_SHAr, u_xlat0);
    u_xlat16_9.y = dot(unity_SHAg, u_xlat0);
    u_xlat16_9.z = dot(unity_SHAb, u_xlat0);
    u_xlat16_9.xyz = u_xlat16_9.xyz + vs_TEXCOORD5.xyz;
    u_xlat16_9.xyz = max(u_xlat16_9.xyz, vec3(0.0, 0.0, 0.0));
    u_xlat16_10.xy = (-u_xlat7.xx) * vec2(0.699999988, 0.0799999982) + vec2(1.70000005, 0.600000024);
    u_xlat16_39 = u_xlat7.x * u_xlat16_10.x;
    u_xlat16_39 = u_xlat16_39 * 6.0;
    u_xlat16_4 = textureLod(unity_SpecCube0, vec3(-u_xlat16_6.x, u_xlat16_6.yz), u_xlat16_39);
    u_xlat16_39 = u_xlat16_4.w + -1.0;
    u_xlat16_39 = unity_SpecCube0_HDR.w * u_xlat16_39 + 1.0;
    u_xlat16_39 = log2(u_xlat16_39);
    u_xlat16_39 = u_xlat16_39 * unity_SpecCube0_HDR.y;
    u_xlat16_39 = exp2(u_xlat16_39);
    u_xlat16_39 = u_xlat16_39 * unity_SpecCube0_HDR.x;
    u_xlat16_6.xyz = u_xlat16_4.xyz * vec3(u_xlat16_39);
    u_xlat19.xyz = (-vs_TEXCOORD1.xyz) * u_xlat1.xxx + _WorldSpaceLightPos0.xyz;
    u_xlat36 = dot(u_xlat19.xyz, u_xlat19.xyz);
    u_xlat36 = max(u_xlat36, 0.00100000005);
    u_xlat36 = inversesqrt(u_xlat36);
    u_xlat19.xyz = vec3(u_xlat36) * u_xlat19.xyz;
    u_xlat36 = dot(u_xlat0.xyz, _WorldSpaceLightPos0.xyz);
    u_xlat36 = clamp(u_xlat36, 0.0, 1.0);
    u_xlat1.x = dot(u_xlat0.xyz, u_xlat19.xyz);
    u_xlat1.x = clamp(u_xlat1.x, 0.0, 1.0);
    u_xlat11 = dot(u_xlat0.xyz, (-u_xlat13.xyz));
    u_xlat11 = clamp(u_xlat11, 0.0, 1.0);
    u_xlat19.x = dot(_WorldSpaceLightPos0.xyz, u_xlat19.xyz);
    u_xlat19.x = clamp(u_xlat19.x, 0.0, 1.0);
    u_xlat31 = u_xlat7.x * u_xlat7.x;
    u_xlat43 = u_xlat31 * u_xlat31;
    u_xlat1.x = u_xlat1.x * u_xlat1.x;
    u_xlat23 = u_xlat31 * u_xlat31 + -1.0;
    u_xlat1.x = u_xlat1.x * u_xlat23 + 1.00001001;
    u_xlat19.x = u_xlat19.x * u_xlat19.x;
    u_xlat19.x = max(u_xlat19.x, 0.100000001);
    u_xlat23 = u_xlat7.x * u_xlat7.x + 0.5;
    u_xlat19.x = u_xlat19.x * u_xlat23;
    u_xlat1.x = u_xlat1.x * u_xlat1.x;
    u_xlat1.x = u_xlat1.x * u_xlat19.x;
    u_xlat1.x = u_xlat1.x * 4.0;
    u_xlat1.x = u_xlat43 / u_xlat1.x;
    u_xlat1.x = u_xlat1.x + -9.99999975e-05;
    u_xlat1.x = max(u_xlat1.x, 0.0);
    u_xlat1.x = min(u_xlat1.x, 100.0);
    u_xlat16_39 = u_xlat7.x * u_xlat31;
    u_xlat16_39 = (-u_xlat16_39) * u_xlat16_10.y + 1.0;
    u_xlat16_38 = (-u_xlat16_38) + 1.0;
    u_xlat16_38 = u_xlat16_38 + _Glossiness;
    u_xlat16_38 = clamp(u_xlat16_38, 0.0, 1.0);
    u_xlat7.xyz = u_xlat1.xxx * u_xlat16_2.xyz + u_xlat16_3.xyz;
    u_xlat7.xyz = u_xlat16_8.xyz * u_xlat7.xyz;
    u_xlat16_3.xyz = u_xlat16_3.xyz * u_xlat16_9.xyz;
    u_xlat7.xyz = u_xlat7.xyz * vec3(u_xlat36) + u_xlat16_3.xyz;
    u_xlat16_3.xyz = u_xlat16_6.xyz * vec3(u_xlat16_39);
    u_xlat16_39 = (-u_xlat11) + 1.0;
    u_xlat16_39 = u_xlat16_39 * u_xlat16_39;
    u_xlat16_39 = u_xlat16_39 * u_xlat16_39;
    u_xlat16_6.xyz = (-u_xlat16_2.xyz) + vec3(u_xlat16_38);
    u_xlat16_2.xyz = vec3(u_xlat16_39) * u_xlat16_6.xyz + u_xlat16_2.xyz;
    u_xlat7.xyz = u_xlat16_3.xyz * u_xlat16_2.xyz + u_xlat7.xyz;
    u_xlat16_11.xyz = texture(_EmissionMap, vs_TEXCOORD0.xy).xyz;
    u_xlat16_2.xyz = u_xlat16_11.xyz * _EmissionColor.xyz + u_xlat7.xyz;
    u_xlat16_38 = _StarEmissionColor.w;
    u_xlat16_38 = clamp(u_xlat16_38, 0.0, 1.0);
    u_xlatb36 = 9.99999975e-05>=u_xlat16_38;
    if(u_xlatb36){
        u_xlat16_3.x = float(0.0);
        u_xlat16_3.y = float(0.0);
        u_xlat16_3.z = float(0.0);
    }
    u_xlat16_39 = dot((-u_xlat13.xyz), (-u_xlat13.xyz));
    u_xlat16_39 = inversesqrt(u_xlat16_39);
    u_xlat16_6.xyz = (-u_xlat13.xyz) * vec3(u_xlat16_39);
    u_xlat16_39 = dot(u_xlat0.xyz, u_xlat16_6.xyz);
    u_xlat16_39 = clamp(u_xlat16_39, 0.0, 1.0);
    u_xlat0.x = (-u_xlat16_39) + 1.0;
    u_xlat0.x = max(u_xlat0.x, 9.99999975e-05);
    u_xlat12.xy = max(_StarRimParams.yx, vec2(0.100000001, 0.0));
    u_xlat0.x = log2(u_xlat0.x);
    u_xlat0.x = u_xlat0.x * u_xlat12.x;
    u_xlat0.x = exp2(u_xlat0.x);
    u_xlat0.x = u_xlat12.y * u_xlat0.x;
    u_xlat0.x = u_xlat16_38 * u_xlat0.x;
    u_xlat16_6.xyz = _StarEmissionColor.xyz * vec3(u_xlat16_38) + u_xlat0.xxx;
    u_xlat16_3.xyz = (bool(u_xlatb36)) ? u_xlat16_3.xyz : u_xlat16_6.xyz;
    u_xlat16_2.xyz = u_xlat16_2.xyz + u_xlat16_3.xyz;
    u_xlat16_3.xyz = (-u_xlat16_2.xyz) + vs_TEXCOORD3.xyz;
    SV_Target0.xyz = vs_TEXCOORD3.www * u_xlat16_3.xyz + u_xlat16_2.xyz;
    SV_Target0.w = 1.0;
    return;
}
