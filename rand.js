const subject = {
	t : "w",
    p_c() {
        return this.t; 
    },
  p_t: function()  {return this.t},
  
};

a = []; 
a[0] = subject; 
a = null; 

console.log(a[0].p_t()); 