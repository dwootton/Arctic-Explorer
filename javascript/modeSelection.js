class ModeSelector {
    constructor(mapPath){
        this.first = true;
        this.mapPath = mapPath;
    }



    updateMode(){
        let myPath = this.mapPath;
        let button = d3.select('#modeSwitch');
        button.on('change', update);
        button.attr('checked','false');
        $('#modeSwitch').trigger('click');

        function update(){
            /*
            if(first){
                d3.select('#chart').transition().duration(500).attr('class','shown');
                d3.select('div #lineMap').transition().duration(500).attr('class','hidden');
                first = false;
                return;
            }
            */


            let status = document.getElementById("modeSwitch").checked; // False => Explorer, True => Navigator
            let modeText = d3.select('#currentMode');
            modeText.attr('padding-bottom',20);
            console.log(this.first)

            if(status){ // Navigator Mode
                //modeButton.selectAll().remove();

                modeText
                    .text('Navigator');
                myPath.changeMapNavLine(1);
                d3.select('#chart').attr('class','hidden');
                //.selectAll('svg').attr('height',0).attr('opacity',0);
                d3.select('div #lineMap').transition().duration(500).attr('class','shown');
                d3.select('div #lineMap').transition().duration(500).attr('display','block').attr('height',300).attr('overflow-y','scroll').attr('overflow-x','scroll');
                d3.select('div #lineMap').select('svg').style('display','block');

            } else { // Explorer Mode
                //modeButton.selectAll().remove();
                modeText
                    .text('Global Exploration');
                myPath.changeMapNavLine(0);
                 d3.select('#chart').transition().duration(500).attr('class','shown');
                 //.selectAll('svg').attr('height',400).attr('opacity',1);
                 d3.select('div #lineMap').transition().duration(500).attr('class','hidden');
                 //.attr('height',0).attr('overflow','hidden');
                 //d3.select('div #lineMap').select('svg').style('display','none');

            }
            
        }
    }
}




//button
//	.on("input", update);


