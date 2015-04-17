	
		var highlight = 0;
    var presets;
    
		
		$(document).ready(function(){
      log("Current Intelligence Level: POTATO");
      
			//Function to show 
			$('#toggleHighlight').click(toggleHighlighting);
			
			//Reset Board
			$('#resetBoard').click(resetBoard);
			
			//Color
			$('#toggleColor').click(toggleColor);
			
			$('#solveAll').click(solveAll);			
			
			$('.grid').click(solve); 
      
      $('#json').click(presetJSON);      
      
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
      loadPreset();
		}
    
		function toggleColor(){
				$('.grid').toggleClass('noColor');
		}
		
		
		function solve(){
				//who called it or who was it called on
				var cellx = $(this).data('x');
				var celly = $(this).data('y');
				//what cluster it belongs to
				var cluster = $(this).data('cluster');
				//what value it holds
				var value = $(this).val();
				
				//value is not set, try to solve 
				if(value == ""){	
				
					//related cells 
					var relatedCellsByClass = [];
						//on x 
					relatedCellsByClass.push(".x"+cellx);
						//on y
					relatedCellsByClass.push(".y"+celly);
						//in cluster
					relatedCellsByClass.push(".c"+cluster);
					
					//work out what values it cannot be from checking for values of each related cells
					var blacklist = [];

					//blacklist cell values
					for(var related = 0; related < relatedCellsByClass.length; related++){
						var indexClass = relatedCellsByClass[related];
						$(indexClass).each(function(){						
							var tmpval = $(this).val();
							$(this).addClass('searched');							
							if(tmpval != ""){
								blacklist.push(tmpval);	
							}							
						});						
					}
					
					//possible values using blacklist
					var possible = [];
					
					//loop over blacklist and test with numbers 1-9
					for(var i = 1; i < 10; i++){						
						var blacklisted = blacklist.indexOf(""+i) > -1;						
						if(blacklisted === false){
							//not in blacklist - add to possible array
							possible.push(i+"");
						}		
					}					
					//console.log(" x"+cellx + " y" + celly + " c" + cluster);
					//when only 1 is possible - set it as solved
					if(possible.length === 1){
          
							log("(x"+cellx+",y"+celly+") Success! Blacklist resulted in unique value.");              
							$(this).val(possible[0]);
							$(this).addClass('solved');
							$(this).removeClass('unsolved');
					}//more than one possible end
          else{
            log("(x"+cellx+",y"+celly+") Possible:"+possible);
          }
					$('.grid').removeClass('searched');
				
				}//blank value end - solve attempted
				else{		
						$(this).addClass('userSolved');			
						$(this).removeClass('unsolved');	
				}
		}
		
		function solveAll(){		
			var unsolved = $(".unsolved").length;
			var attempts = 0;
		
			while(unsolved > 0 && attempts < 6){
				$('.unsolved').each(function(){
					$( this ).trigger( "click" );		
				});
				//timeout 
				unsolved = $(".unsolved").length;
				attempts++;
			}
			
			
			if(unsolved === 0){	
				log("Solve success in: < "+attempts+" board passes.");
			}
			else{
				log("Solve not completed in "+attempts+" full board passes. Stopped.");				
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
	
	