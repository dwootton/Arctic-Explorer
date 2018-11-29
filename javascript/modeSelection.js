
function update(){
	console.log("Here!")

	let status = document.getElementById("modeSwitch").checked; // False => Explorer, True => Navigator
    let modeText = d3.select('#currentMode');
    modeText.attr('padding-bottom',20);

    if(status){ // Navigator Mode
    	//modeButton.selectAll().remove();

    	modeText
    		.text('Navigator');
    	showMapNavLine();
    	d3.select('#chart').selectAll('svg').attr('height',0).attr('opacity',0);
    	d3.select('div #lineMap').attr('display','block');
    	d3.select('div #lineMap').select('svg').attr('display','block');

    } else { // Explorer Mode
    	//modeButton.selectAll().remove();

    	modeText
    		.text('Explorer');
    	hideMapNavLine();
    	 d3.select('#chart').selectAll('svg').attr('height',400).attr('opacity',1);
    	 d3.select('div #lineMap').attr('display','none');
    	 d3.select('div #lineMap').select('svg').attr('display','none');

    }
    
}

function modeSelection(){
	let button = d3.select('#modeSwitch');
	console.log(button);
	button.on('change', update);
}




//button
//	.on("input", update);


