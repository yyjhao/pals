#include <iostream>
#include <sstream>
#include <string>
#include <ctime>
#include <cstdlib>
#include <set>
#include <vector>
#include <map>
#include <cmath>

using namespace std;

const double FricCoe = 0.7;
const double NODE_MASS = 1;
const double GRAPH_SRING = 0.015;
const double CG_STRING = 0.04;
const double COMM_MASS = 2;
const double NODE_REPULSE = 0.015;
const double COMM_REPULSE = 0.1;


class Vec2 {
public:
    Vec2 () {
        a = 0;
        b = 0;
    }
    Vec2 (double a, double b) {
        this->a = a;
        this->b = b;
    }

    Vec2 operator+(const Vec2& other) const {
        return Vec2(a + other.a, b + other.b);
    }

    Vec2 operator-(const Vec2& other) const {
        return Vec2(a - other.a, b - other.b);
    }

    void operator+=(const Vec2& other) {
        a += other.a;
        b += other.b;
    }

    void operator*=(const double c) {
        a *= c;
        b *= c;
    }

    Vec2 unit() {
        return (*this) * (1.0l/len());
    }

    double len() {
        return sqrt(a * a + b * b);
    }

    Vec2 operator*(double c) {
        return Vec2(a * c, b * c);
    }

    string toString() {
        ostringstream s;
        s << a << ' ' << b;
        return s.str();
    }

    void bound(double l, double u) {
        a = max(min(a, u), l);
        b = max(min(b, u), l);
    }
private:
    double a, b;
};

class Node {
public:
    Node (int id, double mass) {
        this->id = id;
        pos = Vec2((double)rand()/(double)RAND_MAX, (double)rand()/(double)RAND_MAX);
        m = mass;
    }

    void clearForce() {
        accel = Vec2(0, 0);
    }

    void addForce(Vec2 f) {
        accel += f * (1.0l / m);
    }

    void move() {
        veloc += accel;
        veloc *= FricCoe;

        veloc.bound(-0.8, 0.8);

        pos += veloc;
    }

    void printSelf() {
        cout<<id<<' '<<pos.toString()<<endl;
    }
    Vec2 pos;
private:
    Vec2 veloc;
    Vec2 accel;
    double m;
    int id;
};

class String {
public:
    String(Node* a, Node* b, double coe) {
        this->a = a;
        this->b = b;
        this->coe = coe;
    }

    void tighten() {
        Vec2 dir = (a->pos - b->pos).unit();
        double dist = (a->pos - b->pos).len();
        if (abs(dist) < 0.01) return;
        double force = dist * coe;
        b->addForce(dir * force);
        a->addForce(dir * (-force));
    }
private:
    Node* a, *b;
    double coe;
};

void repulse(Node* a, Node* b, double coe) {
    Vec2 dis = b->pos - a->pos;
    double l = dis.len();
    if (l < 0.01) {
        l = 0.01;
    }
    Vec2 dir = dis.unit();
    a->addForce(dir * (-coe / l));
    b->addForce(dir * (coe / l));
}

const Vec2 center = Vec2(0.5, 0.5);
void gravityAttract(Node* n) {
    Vec2 dir = (center - n->pos).unit();
    double dist = (center - n->pos).len();
    if (abs(dist) < 0.01) return;
    double force = dist * GRAPH_SRING * 20;
    n->addForce(dir * force);
}

int main() {
    srand(time(NULL));
    string s;
    map<int, Node*> nodes;
    vector<String*> strings;
    map<int, Node*> comms;
    bool readCommunity = false;
    while (getline(cin, s)) {
        if (s.empty()) {
            readCommunity = true;
        } else {
            istringstream tmp(s);
            int a, b;
            tmp >> a >> b;
            if (!nodes.count(a)) {
                nodes[a] = new Node(a, NODE_MASS);
            }
            if (readCommunity) {
                while(b--) {
                    int comm;
                    tmp >> comm;
                    if (!comms.count(comm)) {
                        comms[comm] = new Node(comm, COMM_MASS);
                    }
                    strings.push_back(new String(nodes[a], comms[comm], CG_STRING));
                }
            } else {
                if (!nodes.count(b)) {
                    nodes[b] = new Node(b, NODE_MASS);
                }
                strings.push_back(new String(nodes[a], nodes[b], GRAPH_SRING));
            }
        }
    }
    vector<Node*> commsV, nodesV;
    for (auto c:comms) {
        commsV.push_back(c.second);
    }
    for (auto n:nodes) {
        nodesV.push_back(n.second);
    }
    int iter = 50;
    while (iter--) {
        for (auto c:commsV) {
            c->move();
            c->clearForce();
        }
        for (auto n:nodesV) {
            n->move();
            n->clearForce();
        }
        for (int i = 0; i < commsV.size(); i++) {
            for (int j = i + 1; j < commsV.size(); j++) {
                repulse(commsV[i], commsV[j], COMM_REPULSE);
            }
        }
        for (int i = 0; i < nodesV.size(); i++) {
            for (int j = i + 1; j < nodesV.size(); j++) {
                repulse(nodesV[i], nodesV[j], NODE_REPULSE);
            }
        }
        for (auto n:nodesV) {
            gravityAttract(n);
        }
        for (auto s:strings) {
            s->tighten();
        }
    }
    for (auto n:nodes) {
        n.second->printSelf();
    }
    return 0;
}