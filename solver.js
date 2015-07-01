/*
 *  Initialize solver arrays and tracking variables
 */ 
//the dom ids of each cell
var cellids = ['#00', '#10', '#20', '#30', '#40', '#50', '#60', '#70', '#80', '#01', '#11', '#21', '#31', '#41', '#51', '#61', '#71', '#81', '#02', '#12', '#22', '#32', '#42', '#52', '#62', '#72', '#82', '#03', '#13', '#23', '#33', '#43', '#53', '#63', '#73', '#83', '#04', '#14', '#24', '#34', '#44', '#54', '#64', '#74', '#84', '#05', '#15', '#25', '#35', '#45', '#55', '#65', '#75', '#85', '#06', '#16', '#26', '#36', '#46', '#56', '#66', '#76', '#86', '#07', '#17', '#27', '#37', '#47', '#57', '#67', '#77', '#87', '#08', '#18', '#28', '#38', '#48', '#58', '#68', '#78', '#88'];
// array holding possible values
var possible = [];
//make sure we set up keys
for (var i = 0; i < cellids.length; i++) {
  possible[cellids[i]] = [];
}
//array holding set values
var cellvals = [];
for (var i = 0; i < cellids.length; i++) {
  cellvals[cellids[i]] = 0;
}

// track cells related to cellid (key) on axis (x,y,c) 
var relatedCellsX = [];
var relatedCellsY = [];
var relatedCellsC = [];


/* Request Driver */
onmessage = function(e) {
  request = e.data;
  task = request[0];
  if(task === 'loadBoard'){
    difficulty = request[1];
    loadRandomBoard(difficulty);
  }
  
  if(task === 'resetBoard'){
    resetBoard();
  }
  if(task === 'setCellValue'){
    returnSolution('#'+request[1]+''+request[2], request[3], 'userSolved');
  }
  if(task === 'tryFullSolve'){
    solve();
  }
  if(task === 'simpleSolve'){
    simpleSolveAll();
  }
  if(task === 'checkSolution'){ 
    validate();
  }
  if(task === 'setRelated'){    
    relatedCellsX = request[1];
    relatedCellsY = request[2];
    relatedCellsC = request[3];
    console.log("Relations received and set.");
  }  
}

/*
 * Solve:
 * attempts to intelligently work through the board 
 * to find solutions using progressively more intense 
 * algorithms, returning each solution found.
 */
var solveTrys = 0;
var lastAlgorithm = 'simple'; 
function solve(request){
  var start = new Date().getMilliseconds();
  //begin by updating possibles
  calculateAllPossible();
  
  while(solveTrys < 2){
    for(i = 0; i < cellids.length; i++){
      val = cellvals[cellids[i]];
      //only solve unsolved cells
      if(val == 0){

      
               
          simpleSolve(cellids[i]);        
        
        
        
        
      }
    }
    solveTrys++;
  }
  
  
  var elapsed = new Date().getMilliseconds() - start;
  console.log("Finished in "+elapsed+" ms");
  solveTrys = 0;
}
/*
 * Solving Algorithms:
 */
 
/*
 *  Updates possible array with values for a given cell
 */
calculatePossible = function(cellid){
  //every possible cell related to cellid
  var allRelatedCells = [relatedCellsX[cellid], relatedCellsY[cellid], relatedCellsC[cellid] ];
  //work out blacklist by checking for values in related cells
  var blacklist = [];
  for (var i = 0; i < allRelatedCells.length; i++) {
    var relatedAxis = allRelatedCells[i];    
    for (var j = 0; j < relatedAxis.length; j++) {
      var tmpcell = relatedAxis[j];      
      var tmpval = cellvals[tmpcell];      
      if (tmpval != 0) {
        blacklist.push(tmpval);
      }
    }
  }  
  //update possible values
  possible[cellid] = [];
  //loop over blacklist and test with numbers 1-9
  for (var i = 1; i < 10; i++) {
    var blacklisted = blacklist.indexOf(i) > -1;
    if (blacklisted === false) {
      //not in blacklist - add to possible array
      possible[cellid].push(i);
    }
  } 
  //console.log(blacklist + " means these are possible: "+ possible[cellid]);
}  
/*
 *  Wrapper for calculatePossible to calculate 
 *  possible values board wide
 */
function calculateAllPossible() {
  for (var i = 0; i < cellids.length; i++) {
    calculatePossible(cellids[i]);
  }
}

/*
 *  Simple Solve aka Single Candidate
 *  when only one possible value remains
 */
simpleSolve = function(cellid){  
  cellpossible = possible[cellid];  
  if(cellpossible.length == 1 && cellpossible[0] != 0){
    returnSolution(cellid, cellpossible[0], 'solved');
    
    //solved a solution so we should update;
    calculateAllPossible();
  }
}
/*
 *  Wrapper for simpleSolve to run 
 *  simpleSolve on each cell
 */
function simpleSolveAll() {
  calculateAllPossible();
  for(i = 0; i < cellids.length; i++){
    val = cellvals[cellids[i]];
    if(val == 0){
      simpleSolve(cellids[i]);
    }
  }
}

/*
 * returnSolution('#cellid', 'solution'):
 * posts back each cell's solution and the corresponding 
 * DOM id, should also update programatic grid
 */
returnSolution = function(cellid, solution, solveType){  
  //return to dom
  var cellinfo = [cellid.split('#')[1], solution, solveType];
  var message = ['updateCellDom', cellinfo];
  postMessage(message);
  
  //update programatically
  setCellValue(cellid, solution);
  
  //keep looping
  solveTrys = 0;
}

/*
 * setCellValue('x', 'y' 'val'):
 * sets cell values programatically when
 * changed in DOM. 
 */
setCellValue = function(cellid, val){
  cellvals[cellid] = val;  
}

resetBoard = function(){
  //clear the possibles for each cell 
  for (var i = 0; i < cellids.length; i++) {
    possible[cellids[i]] = [];
  }
  //clear known cell values
  for (var i = 0; i < cellids.length; i++) {
    cellvals[cellids[i]] = 0;
  } 
  //reflect changes in dom
    for (var i = 0; i < cellids.length; i++) {
    returnSolution(cellids[i], '', 'unsolved');
  }
}
/*
 *  Load a random board given a difficulty
 *  from json file of preset boards
 */
var lastBoard = [];
loadRandomBoard = function(){
  //clear current board 
  resetBoard();
  //loading and picking random board
  var request = new XMLHttpRequest();
  request.open("GET", "preset.json", false);
  request.send(null);
  presets = JSON.parse(request.responseText);  
  var difficultyPresets = presets[difficulty];
  var cells = difficultyPresets[0];
  if(difficultyPresets.length > 1){
    var rand = Math.floor((Math.random() * difficultyPresets.length));
    while (rand === lastBoard[difficulty]){
      rand = Math.floor((Math.random() * difficultyPresets.length));
    }
    cells = difficultyPresets[rand];  
    lastBoard[difficulty] = rand;
  }  
  //set values to cells
  for (var key in cells) {
    var tmpcell = cells[key];
    returnSolution('#'+tmpcell[0]+''+tmpcell[1], tmpcell[2], ' presetSolved');
  }
}
/*
 *  Validate the current solution
 */
validate = function(){ 
  var timerStart = new Date().getMilliseconds();
  // check if there is only 1 - 9 in each set
  // else flag set as error 
  related = [relatedCellsX, relatedCellsY, relatedCellsC];

  //array to count numbers occuring
  count = [];
  for(i = 0; i < 10; i++){
    count[i] = 0;
  }

  // loop over each set of related cells
  for(var i = 0; i < related.length; i++){   
    // and each related cell  
    current = related[i];
    console.log("Current: "+i);
    for(var k = 0; k < cellids.length; k++){      
      
      console.log("Related to: "+cellids[k]+" = "+current[cellids[k]]);
      
      
    }  
  }  
  var timerElapsed = new Date().getMilliseconds() - timerStart;
  console.log("Finished Validating in:" + timerElapsed+ " ms");  
}
function pausecomp(millis)
 {
  var date = new Date();
  var curDate = null;
  do { curDate = new Date(); }
  while(curDate-date < millis);
}