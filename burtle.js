// http://www.burtleburtle.net/bob/rand/smallprng.html

(function(global) {

  function uint32(x) { return x >>> 0; }

  function Burtle(seed) {
    if (!(this instanceof Burtle)) { return new Burtle(seed); }

    seed = uint32(seed);
    this.a = 0xf1ea5eed;
    this.b = this.c = this.d = seed;
    for (var i = 0; i < 20; ++i) {
      this.ranval();
    }

    return this;
  }

  function rot(x, k) { return (x << k) | (x >>> (32 - k)); }
  Burtle.prototype.ranval = function() {
    var e = uint32(this.a - rot(this.b, 27));
    this.a = this.b ^ rot(this.c, 17);
    this.b = uint32(this.c + this.d);
    this.c = uint32(this.d + e);
    this.d = uint32(e + this.a);
    return this.d;
  };

  global.Burtle = Burtle;
}(self));
