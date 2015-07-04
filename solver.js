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
    returnSolution(request[1], request[2], 'userSolved');
    updateDOMPossible();
  }
  if(task === 'tryFullSolve'){
    solve();
    updateDOMPossible();
  }
  if(task === 'simpleSolve'){
    simpleSolveAll();
    updateDOMPossible();
  }
  if(task === 'hiddenSingles'){
    hiddenSinglesAll();
    updateDOMPossible();
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
var solveDifficulty = 0;
function solve(request){
  var start = new Date().getMilliseconds();
  //begin by updating possibles
  calculateAllPossible();
  
  while(solveTrys < 2){
    for(i = 0; i < cellids.length; i++){
      val = cellvals[cellids[i]];
      //only solve unsolved cells
      if(val == 0){
        if(solveDifficulty == 0){          
          simpleSolve(cellids[i]); 
        } 
        if(solveDifficulty == 1){
          hiddenSinglesSolve(cellids[i]);
        }
        if(solveDifficulty > 2){
          break;
        }
      }
    }    
    solveDifficulty++;
    solveTrys++;    
  }
  
  var elapsed = new Date().getMilliseconds() - start;
  console.log("Finished in "+elapsed+" ms");
  
  unsolved = 0;
  for(i = 0; i < cellids.length; i++){
    if(cellvals[cellids[i]] == 0){
      unsolved++;
    }
  }
  if(unsolved === 0){    
    validate();
    log("Solved in: "+elapsed+" ms. Hooray!");
  }else{
    percent = Math.round((unsolved / 81) * 100);   
    log("Solve attempt finished in: "+elapsed+" ms. "+unsolved+" cells ("+percent+"%) remaining");
    log("Solution too hard! (for now)"); 
     
  }    
  solveTrys = 0;
}
/*
 * Solving Algorithms:
 */
/*
 *  Updates possible array with values for a given cell
 */
calculatePossible = function(cellid){
  if(cellvals[cellid] != 0){
    //Cell is filled, therefore the filled value is the only one possible!
    possible[cellid] = [];
    possible[cellid].push(cellvals[cellid]);
  }
  else{    
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
  }
}  
/*
 *  Wrapper for calculatePossible to calculate 
 *  possible values board wide
 */
calculateAllPossible = function() {
  for (var i = 0; i < cellids.length; i++) {
    calculatePossible(cellids[i]);
  }
}

updateDOMPossible = function(){
  for (var i = 0; i < cellids.length; i++) {
    var cellinfo = ['#p'+cellids[i].split('#')[1], possible[cellids[i]]];
    var message = ['updatePossibleOverlay', cellinfo];
    postMessage(message); 
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
simpleSolveAll = function() {
  var timerStart = new Date().getMilliseconds();
  calculateAllPossible();
  for(i = 0; i < cellids.length; i++){
    val = cellvals[cellids[i]];
    if(val == 0){
      simpleSolve(cellids[i]);
    }
  }
  var timerElapsed = new Date().getMilliseconds() - timerStart;
  log('Simple Solve (Last Candidate) pass done in: '+timerElapsed+" ms");
}
/*
 *  Attempts candidate elimination by comparing possibilities of related cells
 *  for a hidden unique value - AKA 'hidden singles'
 */
hiddenSinglesSolve = function(cellid) {
  calculateAllPossible();  
  allRelatedCells = [relatedCellsX[cellid], relatedCellsY[cellid], relatedCellsC[cellid]];
  //loop over each axis
  for (var i = 0; i < allRelatedCells.length; i++) {
    var relatedAxis = allRelatedCells[i];
    var counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var cellsInCount = [];

    //Remember to use own cell value in elimination
    if (cellvals[cellid] == "") {
      cellsInCount.push(cellid);
      var tmppos = possible[cellid];
      for (var p = 0; p < tmppos.length; p++) {
        //add to the count 
        counts[tmppos[p]]++;
      }
    }

    //loop over each related cell by axis i
    for (var j = 0; j < relatedAxis.length; j++) {            
      var tmpval = cellvals[relatedAxis[j]];
      if (tmpval == "") {
        //remember who to look through for next time
        cellsInCount.push(relatedAxis[j]);
        //we get the possible for current related cell
        var tmppos = possible[relatedAxis[j]];
        for (var p = 0; p < tmppos.length; p++) {
          //add to the count 
          counts[tmppos[p]]++;
        }
      }
    }
    //now we have a counts array which contains how many times each p val occured
    var onlyhere = [];
    for (var c = 0; c < counts.length; c++) {
      if (counts[c] === 1) {
        //if one of these is 1 -> we have found a value unique possible value.
        var uniqueval = c;
        onlyhere.push(uniqueval);
      }
    }
    //we have to make sure that there was only 1 value with 1 pos count 
    if (onlyhere.length === 1) {
      //if its the only one, it is a true value
      //loop over related axis again to quickly check if val in possible ->
      for (var j = 0; j < cellsInCount.length; j++) {
        var tmppos = possible[cellsInCount[j]];
        if (tmppos.indexOf(onlyhere[0]) > -1) {
          // found!!!  
          var foundcell = cellsInCount[j];          
          returnSolution('#'+foundcell[1]+""+foundcell[2],onlyhere[0],'hiddenSingle');
          calculateAllPossible();
        }
      }
    }
  }
}

function hiddenSinglesAll() {
  var timerStart = new Date().getMilliseconds();
  calculateAllPossible();
  for(i = 0; i < cellids.length; i++){
    val = cellvals[cellids[i]];
    if(val == 0){
      hiddenSinglesSolve(cellids[i]);
    }
  }
  var timerElapsed = new Date().getMilliseconds() - timerStart;
  log('Hidden Singles candidate elimination done in: '+timerElapsed+" ms");
}


/*
 * returnSolution('#cellid', 'solution', type):
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
  //use the simple algorithm again
  solveDifficulty = 0;  
}

/*
 * setCellValue('x', 'y' 'val'):
 * sets cell values programatically when
 * changed in DOM. 
 */
setCellValue = function(cellid, val){
  if(val === ''){
    val = 0;
  } 
  intval = parseInt(val);
  cellvals[cellid] = intval;  
}

/*
 *  Clears board in solver and DOM
 */
resetBoard = function(){
  //clear the possibles for each cell 
  for (var i = 0; i < cellids.length; i++) {
    possible[cellids[i]] = [];
  }
  //reflect changes in dom
  for (var i = 0; i < cellids.length; i++) {
    returnSolution(cellids[i], '', 'unsolved');
  }
  log("<br />");
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
    possible['#'+tmpcell] = parseInt(tmpcell[2]);
  }
  calculateAllPossible();
  updateDOMPossible();  
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
  //broken cells
  invalid = false;
  // loop over each set of related cells
  for(var i = 0; i < related.length; i++){   
    // and each related cell  
    current = related[i];
    for(var k = 0; k < cellids.length; k++){ 
      //console.log("Related to: "+cellids[k]+" = "+current[cellids[k]]);
      currentid = cellids[k];      
      //count the cell we are on's value too
      if(cellvals[currentid] == 0){
        //count[0]++;
        invalid = true; 
        break;
      }else{
        count[cellvals[currentid]]++;
      }
      relatedToCurrent = current[cellids[k]];      
      for(var val = 0; val < relatedToCurrent.length; val++){   
        relatedId = relatedToCurrent[val];        
        if(cellvals[relatedId] == ''){
          count[0]++;
          invalid = true;
          break;
        }
        else{
          count[cellvals[relatedId]]++;
        }
      }      
      if(count[0] != 0){
        count[0] = 0;
        invalid = true;
        break;
      }
      for(var i = 1; i < 10; i++){        
        if(count[i] == 0){
          invalid = true; 
        }
        if(count[i] > 1){
          invalid = true;          
        }        
        count[i] = 0;
      }
    }
  }
  var timerElapsed = new Date().getMilliseconds() - timerStart;
  if(invalid){
    log("Invalid Solution! Validated in " + timerElapsed+ "ms");
  }else{
    log("Valid Solution! Validated in " + timerElapsed+ "ms");
  }  
}

log = function(msg){
  var message = ['logMessage', msg];
  postMessage(message);
}

//function for generating artificial delay
function pausecomp(millis)
 {
  var date = new Date();
  var curDate = null;
  do { curDate = new Date(); }
  while(curDate-date < millis);
}