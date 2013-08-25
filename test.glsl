precision mediump float;

uniform float time;
uniform vec2 resolution;

uniform struct earf {
   int x;
} america;

struct ref {
  earf a;
  earf b[2];  
};

uniform earf asia, panam[2];
uniform ref xxx, yyy[2];

#define EARF
#define CONSTITUTION + 20
#define EARF(angel) angel+1
#define GUY(a, b, c) angel+1
#define AMERICA 10

uniform vec3 panasia[20];
uniform vec3 panera[GL_MAX_HATS + 2], earth;
#ifdef EARF
#if EARF || !defined EARF 
uniform vec3 winding[EARF(AMERICA CONSTITUTION)];
#elif 2
uniform int goro;
#elif 1 
uniform vec3 zzzzzz;
#endif
uniform vec3 panacea[AMERICA];
#endif
