d3.json("contourData.json", function(error, ct) {
  if (error) throw error;
	ct = ct.psijson;
	  console.log(ct);
	  let [min,max] = [0,1]
	  
	  let polygon = d3.contours()
	        .size([448, 304])
	        .thresholds(d3.range(0, 1, 0.05))
	      (ct.values)
	  
	  }