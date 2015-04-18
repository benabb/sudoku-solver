	
		var highlight = 0;
    var presets;
    var timer = new Date();
    //Initialize board references and data containers
    //the dom ids of each cell
    var cellids = ['#00','#10','#20','#30','#40','#50','#60','#70','#80','#01','#11','#21','#31','#41','#51','#61','#71','#81','#02','#12','#22','#32','#42','#52','#62','#72','#82','#03','#13','#23','#33','#43','#53','#63','#73','#83','#04','#14','#24','#34','#44','#54','#64','#74','#84','#05','#15','#25','#35','#45','#55','#65','#75','#85','#06','#16','#26','#36','#46','#56','#66','#76','#86','#07','#17','#27','#37','#47','#57','#67','#77','#87','#08','#18','#28','#38','#48','#58','#68','#78','#88'];
    //possible values for each cell by id
    var possible = [];
      //make sure we set up keys
      for(var i = 0; i < cellids.length; i++){        
        possible[cellids[i]] = null;
      }
      
    // cells related to cellid (key) on axis (x,y,c) 
    var relatedCellsX = [], relatedCellsY = [], relatedCellsC = []; 

     
    
		$(document).ready(function(){
      calculateRelations();
      log("Current Intelligence Level: POTATO");
      
			//Function to show 
			$('#toggleHighlight').click(toggleHighlighting);
			
			//Reset Board
			$('#resetBoard').click(resetBoard);
			
			//Color
			$('#toggleColor').click(toggleColor);
			
			$('#solveAll').click(solveAll);			
			
			$('.grid').click(solveThis); 
      
      $('#json').click(presetJSON);   

      $('#difficulty').change(presetBoard);
      
			$('.grid').mouseover(function(e){				
				mouseX=e.pageX;
				mouseY=e.pageY;
				
				//window.outerWidth is not working in IE
				var windowWidth  = $(window).outerWidth();
				var windowHeight = $(window).outerHeight(); 
					
				var popX = windowWidth - mouseX;
				var popY = windowHeight - mouseY;

				//set the position first. remove the position attr in css 
				var pos = $(this).data('possible');
				if(pos != undefined){
					$('.popup').text( $(this).data('possible') );				
					$('.popup').css({position:"absolute",top:mouseY,left:mouseX});
					//$('.popup').css({position:"absolute",top:t,left:l});
					$('.popup').show();
				}			
     });
		 $('.grid').mouseout(function(){
			$('.popup').hide();
		 })	

      $.getJSON( "preset.json", function(data){
        presets = data;
        log('Presets loaded');
      });
		});

		function resetBoard(){
      $('.grid').val('');
      $('.grid').removeClass("solved userSolved");			
			$('.grid').addClass("unsolved");
      $('#log').html('');  
		}
    
    function presetBoard(){
       resetBoard();
       loadPreset();
    }
    
		function toggleColor(){
				$('.grid').toggleClass('noColor');
		}
		
    function crossPossibilitySolve(){
        var cellx = $(this).data('x');
				var celly = $(this).data('y');
        var cluster = $(this).data('cluster');
        
        /*
          for each related cell on /axis/
            calculate possible / fetch possible where val = ''            
                3,5,6
                 3,1,5
                  3,1  
           == one with 6 is a 6.
           count each?
           3x3 5x2 1x2 6x1
           where # of occurances = 1
            get cell with # with 1 occurances
            set val to #
        */  
    }
    
    /*
     * Loop over all cells in idlist and generate relationships based on axis
     */
     function calculateRelations(){      
      var start = new Date().getMilliseconds();       
       for(i = 0; i < cellids.length; i++){
          var cellid = cellids[i];         
          //hassh is cellid[0]
          var x = cellid[1];
          var y = cellid[2];
          var c = $(cellid).data('cluster');
          //related by x
          var relatedByX = [];
          $('.x'+x).each(function(){
            var tmpid = '#'+$(this).attr('id');          
            if(tmpid === cellid){
              //skip
            }
            else{
              //add
              relatedByX.push('#'+$(this).attr('id'));              
            }           
          });          
          var relatedByY = [];
          $('.y'+y).each(function(){
            var tmpid = '#'+$(this).attr('id');          
            if(tmpid === cellid){
              //skip
            }
            else{
              //add
              relatedByY.push('#'+$(this).attr('id'));
            }           
          });          
          var relatedByC = [];
          $('.c'+c).each(function(){
            var tmpid = '#'+$(this).attr('id');          
            if(tmpid === cellid){
               //skip
            }
            else{
              //add
              relatedByC.push('#'+$(this).attr('id'));
            }           
          });
          //attach relations by axis to array by key
          relatedCellsX[cellid] = relatedByX;
          relatedCellsY[cellid] = relatedByY;
          relatedCellsC[cellid] = relatedByC;
        }       
       //report ttc
       var elapsed  = new Date().getMilliseconds() - start;
        log('Generated relations in '+elapsed+"ms");
     }
         
    /*
     *  Works out possible cells by blacklisting values from related cells
     *  takes: cellid = #xy
     */   
    function calculatePossible(cellid){ 
        var start = new Date().getMilliseconds();
        //every possible cell related to cellid
        var allRelatedCells = [relatedCellsX[cellid], relatedCellsY[cellid], relatedCellsC[cellid]];
        
        //work out blacklist by checking for values in related cells
        var blacklist = [];
        
        for(var i = 0; i < allRelatedCells.length; i++){
          var relatedAxis = allRelatedCells[i];          
          for(var j = 0; j < relatedAxis.length; j++){
            var tmpcell = relatedAxis[j];            
            var tmpval = $(tmpcell).val();
            if(tmpval != ""){
              blacklist.push(tmpval);
            }
          }          
        }
       //update possible values       
       //reset current
       possible[cellid] = [];
       
       //loop over blacklist and test with numbers 1-9
       for(var i = 1; i < 10; i++){						
          var blacklisted = blacklist.indexOf(""+i) > -1;						
          if(blacklisted === false){
            //not in blacklist - add to possible array
            possible[cellid].push(i);
          }		
       }
       var elapsed = new Date().getMilliseconds() - start;
       console.log("Probabilities calculated in "+elapsed+"ms");
    }
    
    /*
     * Solve wrapper when cell clicked
     */
		function solveThis(){
       solve('#'+$(this).attr('id'));
    } 
    
    /*
     *  The meat in this sandwich
     */
		function solve(cellid){
      var start = new Date().getMilliseconds();
      
      var cellid = cellid;
      var value = $(cellid).val();
      
      //try to solve
      if(value === ''){
        calculatePossible(cellid);
        
        var possiblevalues = possible[cellid]; 
        
        if(possiblevalues.length === 1){        
          $(cellid).val(possiblevalues[0]);
          $(cellid).removeClass('unsolved');
          $(cellid).addClass('solved');
          log('x'+cellid[1]+'y'+cellid[2]+' solved. single possibilty remained.');          
          //trigger update to related cells possibles now? 
        }
        else{          
          log(possiblevalues+' possible in x'+cellid[1]+'y'+cellid[2]);
        }
      }
      else{
        //value isnt blank so must be solved by user
        $(this).addClass('userSolved');			
				$(this).removeClass('unsolved');
      }

      var elapsed = new Date().getMilliseconds() - start;
      console.log("Solve attempted in "+elapsed+"ms");
    }
		
		function solveAll(){		
      var start = new Date().getMilliseconds(); 
      
      var unsolved = $(".unsolved").length;
			var attempts = 0;
      
			while(unsolved > 0 && attempts < 6){
        
        //loop over each cellid
        for(var i = 0; i < cellids.length; i++){          
          solve(cellids[i]);          
        }      
				
				unsolved = $(".unsolved").length;
				attempts++;
			}

      var elapsed = new Date().getMilliseconds() - start;
      
			if(unsolved === 0){	
				log("Solve success in: < "+attempts+" board passes. Time taken: "+elapsed+" ms");
			}
			else{
				log("Solve not completed in "+attempts+" full board passes. Stopped after "+elapsed+" ms");				
			}	
		}
		
		function toggleHighlighting(){
			if( highlight == 1){		
				$('.grid').each(function(){
						$(this).off('mouseover');
						$(this).off('mouseover');
				});			
				$(this).text("Highlight (Off)");
				highlight = 0;
			}else if( highlight == 0){		
					$('.grid').each(function(){
						$(this).mouseover(highLight);
						$(this).mouseout(unhighLight);	
						$(this).data('state', 'on');					
					});
				$(this).text("Highlight (On)");
				highlight = 1;			
		}			
		}
		
		function highLight(){		
			var value = $(this).text();
			var x = ".x"+$(this).data('x');
			var y = ".y"+$(this).data('y');
			var cluster = ".c"+$(this).data('cluster');

			//highlight all with same x, y and cluster
			$(cluster).addClass('highlight');
			$(x).addClass('highlight');
			$(y).addClass('highlight');
		}
		
		function unhighLight(){		
			var value = $(this).text();
			var x = ".x"+$(this).data('x');
			var y = ".y"+$(this).data('y');
			var cluster = ".c"+$(this).data('cluster');

			//highlight all with same x, y and cluster
				$(cluster).removeClass('highlight');
				$(x).removeClass('highlight');
				$(y).removeClass('highlight');			
		}
	
    function log(message){
      $('#log').html(message+'<br/>'+$('#log').html()+'');      
    }
    
    function presetJSON(){     
      log('}');
      $('.grid').each(function(){
        if($(this).val() != ''){             
            log(',"x'+$(this).attr('data-x')+'y'+$(this).attr('data-y')+'": [ '+$(this).attr('data-x')+','+$(this).attr('data-y')+','+$(this).val()+']'); 
        }        
      });      
      log('{');
    }
  
    function loadPreset(){
      //what preset to load      
      var difficulty = $('#difficulty').val();      
      var difficultyPresets = presets[difficulty];  
      var cells = difficultyPresets[0];      
      for (var key in cells) {
        var tmpcell = cells[key];        
        var xclass = '.x'+tmpcell[0];
        var yclass = '.y'+tmpcell[1];        
        $(xclass).each(function(){          
          if($(this).attr('data-y') == tmpcell[1]){
            $(this).val(tmpcell[2]);
            $(this).removeClass('unsolved');
            $(this).addClass('userSolved');
          }          
        });
      }      
    }
    
		function clusterCell(x, y){
			if(y == 0 || y == 1 || y == 2){
			//row 1
			 if(x == 0 || x == 1 || x ==2){
				//cluster 1
				return 0;
			 }
			 else if(x == 3 || x == 4 || x ==5){
				//cluster 2
				return 1;
			 }
			 else if(x == 6 || x == 7 || x ==8){
				//cluster 3
				return 2;
			 }
		}
		else if(y == 3 || y == 4 || y == 5){
			//row 2
			 if(x == 0 || x == 1 || x ==2){
				//cluster 4
				return 3;
			 }
			 else if(x == 3 || x == 4 || x ==5){
				//cluster 5
				return 4;
			 }
			 else if(x == 6 || x == 7 || x ==8){
				//cluster 6
				return 5;
			 }
		}
		else if(y == 6 || y == 7 || y == 8){
			//row 3
			if(x == 0 || x == 1 || x ==2){
				//cluster 7
				return 6;
			 }
			 else if(x == 3 || x == 4 || x ==5){
				//cluster 8
				return 7;
			 }
			 else if(x == 6 || x == 7 || x ==8){
				//cluster 9
				return 8;
			 }
		}
}
	
	