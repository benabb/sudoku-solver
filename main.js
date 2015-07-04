$(document).ready(function(){
  
var grid = document.querySelectorAll('.grid');
var solveButton = document.querySelector('#solveAll');
var simpleSolveButton = document.querySelector('#simpleSolve');
var hiddenSinglesButton = document.querySelector('#hiddenSingles');
var reset = document.querySelector('#resetBoard');
var validate = document.querySelector('#validate');

var difficulty = document.querySelector('#difficulty');
var preset = document.querySelector('#preset');

$('#20, #21, #22, #23, #24, #25, #26, #27, #28, #50, #51, #52, #53, #54, #55, #56, #57,#58').css('border-right', '1px solid #FF931E');
$('#30, #31, #32, #33, #34, #35, #36, #37, #38, #60, #61, #62, #63, #64, #65, #66, #67,#68').css('border-left', '1px solid #FF931E');
$('#02, #12, #22, #32, #42, #52, #62, #72, #82, #05, #15, #25, #35, #45, #55, #65, #75, #85').css('border-bottom', '1px solid #FF931E');
$('#03, #13, #23, #33, #43, #53, #63, #73, #83, #06, #16, #26, #36, #46, #56, #66, #76, #86').css('border-top', '1px solid #FF931E');

if (!!window.Worker) {
  //initialize the worker and page
	var solver = new Worker("solver.js");
  calculateRelations();
  loadBoard();
  $('.grid').keyup(function(){
    solver.postMessage(['setCellValue', '#'+this.id, this.value]);    
  });
  $('#possible').click(function(){
    $('#possibleBoard').toggle(0);
  });
  
  /* The big red button */
	solveButton.onclick = function() {
    solver.postMessage(['tryFullSolve']);	  
	}
  
	simpleSolveButton.onclick = function() {
    solver.postMessage(['simpleSolve']);	  
	}  
  hiddenSinglesButton.onclick = function() {
    solver.postMessage(['hiddenSingles']);	  
	}  
  /* Reset and Load New */
  reset.onclick = function(){
    solver.postMessage(['resetBoard']);    
  }
  preset.onclick = function(){
    loadBoard()
  }
  difficulty.onchange = function(){
    loadBoard();
  }
  
  /* Validate */
  validate.onclick = function(){
    solver.postMessage(['checkSolution']);	  
  }
  
  /*
   *  Process results from solver
   */   
	solver.onmessage = function(e) {
    // e.data = [action, dataarray]
    response = e.data;
    if(response[0] === 'updateCellDom'){      
      cellinfo = response[1];
      cellDom = document.getElementById(cellinfo[0]); 
      cellVal = cellinfo[1]; 
      cellClass = cellinfo[2];  
      
      cellDom.value = cellVal;      
      cellDom.className = 'grid '+cellClass;
      
      //destroy variables 
      delete(cellinfo);
      delete(cellDom);
      delete(cellClass);
      delete(cellVal);
    }
    else if(response[0] === 'logMessage'){
      msg = "<p>"+ response[1] +"</p>";
      log = $('#log').html();
      $('#log').html(msg+=log);
    }
    else if(response[0] === 'updatePossibleOverlay'){
        cellinfo = response[1];
        cellposid = cellinfo[0];
        cellpos = cellinfo[1];
        $(cellposid).html(cellpos); 
    }
    else{
      alert(e.data);
    }
	}
}

/*
   * Loop over all cells in idlist and generate 
   * relationships based on axis, this is supplied
   * to the solver 
   */
  function calculateRelations() {
    var timerStart = new Date().getMilliseconds();
    
    cellids = ['#00', '#10', '#20', '#30', '#40', '#50', '#60', '#70', '#80', '#01', '#11', '#21', '#31', '#41', '#51', '#61', '#71', '#81', '#02', '#12', '#22', '#32', '#42', '#52', '#62', '#72', '#82', '#03', '#13', '#23', '#33', '#43', '#53', '#63', '#73', '#83', '#04', '#14', '#24', '#34', '#44', '#54', '#64', '#74', '#84', '#05', '#15', '#25', '#35', '#45', '#55', '#65', '#75', '#85', '#06', '#16', '#26', '#36', '#46', '#56', '#66', '#76', '#86', '#07', '#17', '#27', '#37', '#47', '#57', '#67', '#77', '#87', '#08', '#18', '#28', '#38', '#48', '#58', '#68', '#78', '#88'];
    relatedCellsX = [];
    relatedCellsY = [];
    relatedCellsC = []; 
    
    for (i = 0; i < cellids.length; i++) {
      var cellid = cellids[i];
      //hassh is cellid[0]
      var x = cellid[1];
      var y = cellid[2];
      var c = $(cellid).data('cluster');
      //related by x
      var relatedByX = [];
      $('.x' + x).each(function() {
        var tmpid = '#' + $(this).attr('id');
        if (tmpid === cellid) {
          //skip
        } else {
          //add
          relatedByX.push('#' + $(this).attr('id'));
        }
      });
      var relatedByY = [];
      $('.y' + y).each(function() {
        var tmpid = '#' + $(this).attr('id');
        if (tmpid === cellid) {
          //skip
        } else {
          //add
          relatedByY.push('#' + $(this).attr('id'));
        }
      });
      var relatedByC = [];
      $('.c' + c).each(function() {
        var tmpid = '#' + $(this).attr('id');
        if (tmpid === cellid) {
          //skip
        } else {
          //add
          relatedByC.push('#' + $(this).attr('id'));
        }
      });
      //attach relations by axis to array by key
      relatedCellsX[cellid] = relatedByX;
      relatedCellsY[cellid] = relatedByY;
      relatedCellsC[cellid] = relatedByC;
    }
    //report ttc
    var timerElapsed = new Date().getMilliseconds() - timerStart;
   
    //post to worker
    message = ['setRelated', relatedCellsX, relatedCellsY, relatedCellsC];
    solver.postMessage(message);
    console.log('Generated relations in ' + timerElapsed + "ms. Sent to worker.");
    
    delete(cellids);
    delete(relatedCellsX);
    delete(relatedCellsY);
    delete(relatedCellsC);
  }
  
  function loadBoard(){
    message = ['loadBoard', difficulty.value];
    solver.postMessage(message);
    console.log('Loading '+difficulty.value+' board.'); 
  }
});


