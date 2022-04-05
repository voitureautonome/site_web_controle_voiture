#include <node.h>
#include <v8.h>
#include <wiringPi.h>
#include <wiringPiI2C.h>
#include "pca9685.h"
#include <stdio.h>
// #include <src/CYdLidar.h>

#define PIN_BASE 300
#define MAX_PWM 4096
#define HERTZ 60
#define M_PI 3.14159265358979323846

/**
 * Calculate the number of ticks the signal should be high for the required amount of time
 */
int calcTicks(float impulseMs, int hertz)
{
    float cycleMs = 1000.0f / hertz;
    return (int)(MAX_PWM * impulseMs / cycleMs + 0.5f);
}

/**
 * input is [0..1]
 * output is [min..max]
 */
float map(float input, float min, float max)
{
    return (input * max) + (1 - input) * min;
}

void arreterVoiture()
{
    pwmWrite(PIN_BASE + 4, 0);
    pwmWrite(PIN_BASE + 5, 0);
}

void avancerVoiture()
{
    digitalWrite(0, 0);
    digitalWrite(2, 0);
    pwmWrite(PIN_BASE + 4, calcTicks(12, HERTZ));
    pwmWrite(PIN_BASE + 5, calcTicks(12, HERTZ));
}

void reculerVoiture()
{
    digitalWrite(0, 1);
    digitalWrite(2, 1);
    pwmWrite(PIN_BASE + 4, calcTicks(12, HERTZ));
    pwmWrite(PIN_BASE + 5, calcTicks(12, HERTZ));
}

void tourner(float value)
{
    float r = (value + 45.f) / 100;
    float millis = map(r, 1, 2);
    int tick = calcTicks(millis, HERTZ);
    pwmWrite(PIN_BASE + 0, tick);
}
void toutDroit()
{
    tourner(12);
}

void avancer(const v8::FunctionCallbackInfo<v8::Value> &args)
{
    avancerVoiture();
}

void reculer(const v8::FunctionCallbackInfo<v8::Value> &args)
{
    reculerVoiture();
}
void arreter(const v8::FunctionCallbackInfo<v8::Value> &args){
    arreterVoiture();
}
void direction(const v8::FunctionCallbackInfo<v8::Value> &args)
{
    if (args.Length() < 1)
        return;
    if (!args[0]->IsNumber())
        return;
    v8::Isolate *isolate = args.GetIsolate();
    double angle = 0;
    angle = args[0]->NumberValue(isolate->GetCurrentContext()).FromMaybe(angle);
    printf("angle %f\n", angle);
    tourner(angle);
}
void Init(const v8::FunctionCallbackInfo<v8::Value> &args)
{
    v8::Isolate *isolate = args.GetIsolate();
    v8::String::Utf8Value str(isolate, args[0]);
    std::string port(*str);
    wiringPiSetup();
    pinMode(23, OUTPUT);
    pinMode(30, OUTPUT);
    pinMode(1, OUTPUT);
    digitalWrite(30, 2);
    digitalWrite(1, 1);
    int fd = pca9685Setup(PIN_BASE, 0x40, HERTZ);
    if (fd < 0)
    {
        printf("Error in setup\n");
    }
}

void Close(const v8::FunctionCallbackInfo<v8::Value> &args)
{
    // serial_stop();
}

// Not using the full NODE_MODULE_INIT() macro here because we want to test the
// addon loader's reaction to the FakeInit() entry point below.
extern "C" NODE_MODULE_EXPORT void
NODE_MODULE_INITIALIZER(v8::Local<v8::Object> exports, v8::Local<v8::Value> module, v8::Local<v8::Context> context)
{
    NODE_SET_METHOD(exports, "avancer", avancer);
    NODE_SET_METHOD(exports, "reculer", reculer);
    NODE_SET_METHOD(exports, "direction", direction);
    NODE_SET_METHOD(exports, "arreter", arreter);
    NODE_SET_METHOD(exports, "init", Init);
    NODE_SET_METHOD(exports, "close", Close);
}

static void Useless(v8::Local<v8::Object> exports, v8::Local<v8::Value> module, v8::Local<v8::Context> context)
{
}

// Define a Node.js module, but with the wrong version. Node.js should still be
// able to load this module, multiple times even, because it exposes the
// specially named initializer above.
#undef NODE_MODULE_VERSION
#define NODE_MODULE_VERSION 3
NODE_MODULE(NODE_GYP_MODULE_NAME, Useless)