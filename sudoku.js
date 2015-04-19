  var highlight = 0;
  var presets;
  var consecutiveFails = 0;

  //Initialize board references and data containers
  //the dom ids of each cell
  var cellids = ['#00', '#10', '#20', '#30', '#40', '#50', '#60', '#70', '#80', '#01', '#11', '#21', '#31', '#41', '#51', '#61', '#71', '#81', '#02', '#12', '#22', '#32', '#42', '#52', '#62', '#72', '#82', '#03', '#13', '#23', '#33', '#43', '#53', '#63', '#73', '#83', '#04', '#14', '#24', '#34', '#44', '#54', '#64', '#74', '#84', '#05', '#15', '#25', '#35', '#45', '#55', '#65', '#75', '#85', '#06', '#16', '#26', '#36', '#46', '#56', '#66', '#76', '#86', '#07', '#17', '#27', '#37', '#47', '#57', '#67', '#77', '#87', '#08', '#18', '#28', '#38', '#48', '#58', '#68', '#78', '#88'];
  //possible values for each cell by id
  var possible = [];
  //make sure we set up keys
  for (var i = 0; i < cellids.length; i++) {
    possible[cellids[i]] = [];
  }

  // cells related to cellid (key) on axis (x,y,c) 
  var relatedCellsX = [];
  var relatedCellsY = [];
  var relatedCellsC = [];

  $(document).ready(function() {
    // Works out relations between cells
    calculateRelations();
    
    // Loads example from json
    $.getJSON("preset.json", function(data) {
      presets = data;
      log('Presets loaded');
    });

    /*
     *  Button Binds
     */
    //solve when clicked 
    $('.grid').click(solveThis);
    //solve all
    $('#solveAll').click(solveAll);
    //Reset Board & Load a preset
    $('#resetBoard').click(resetBoard);
    $('#difficulty').on('change click', presetBoard);
    // Validate Solution
    $('#validate').click(validateSolution);
    
    //Random Event binds I used sometime or another
    $('#toggleHighlight').click(toggleHighlighting);
    //Sorta makes json.
    $('#json').click(presetJSON);
    
    //Possibility popup
    $('.grid').mouseover(function(e) {
      mouseX = e.pageX;
      mouseY = e.pageY;
      var windowWidth = $(window).outerWidth();
      var windowHeight = $(window).outerHeight();
      var popX = windowWidth - mouseX;
      var popY = windowHeight - mouseY;
      //set the position first. remove the position attr in css 
      var pos = possible['#' + $(this).attr('id')];
      if (pos.length != 0) {
        $('.popup').text(possible['#' + $(this).attr('id')] + ' possible');
        $('.popup').css({
          position: "absolute",
          top: mouseY,
          left: mouseX
        });
        //$('.popup').css({position:"absolute",top:t,left:l});
        $('.popup').show();
      }
    });
    $('.grid').mouseout(function() {
      $('.popup').hide();
    })
  });
  
  /*
   *  Resets the board and everything else involved.  
   */
  function resetBoard() {
    possible = [];
    $('.grid').val('');
    $('.grid').removeClass("solved userSolved crossSolved invalid");
    $('.grid').addClass("unsolved");
    $('#log').html('');
  }

  /*
   *  Resets board and loads a preset
   */
  function presetBoard() {
    resetBoard();
    loadPreset();
  }

  /*
   * Loop over all cells in idlist and generate 
   * relationships based on axis
   */
  function calculateRelations() {
    var start = new Date().getMilliseconds();
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
    var elapsed = new Date().getMilliseconds() - start;
    log('Generated relations in ' + elapsed + "ms");
  }

  /*
   *  Works out possible cells by blacklisting values from related cells
   *  takes: cellid = #xy
   */
  function calculatePossible(cellid) {
      //every possible cell related to cellid
      var allRelatedCells = [relatedCellsX[cellid], relatedCellsY[cellid], relatedCellsC[cellid]];
      
      //work out blacklist by checking for values in related cells
      var blacklist = [];
      for (var i = 0; i < allRelatedCells.length; i++) {
        var relatedAxis = allRelatedCells[i];
        for (var j = 0; j < relatedAxis.length; j++) {
          var tmpcell = relatedAxis[j];
          var tmpval = $(tmpcell).val();
          if (tmpval != "") {
            blacklist.push(tmpval);
          }
        }
      }
      
      //update possible values
      possible[cellid] = [];

      //loop over blacklist and test with numbers 1-9
      for (var i = 1; i < 10; i++) {
        var blacklisted = blacklist.indexOf("" + i) > -1;
        if (blacklisted === false) {
          //not in blacklist - add to possible array
          possible[cellid].push(i);
        }
      }
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
   *  Wrapper for calculatePossible to calculate possible values
   *  for each relation to a given target cell
   */
  function updateRelatedPossible(cellid) {
    var cellid = cellid;
    var allRelatedCells = [relatedCellsX[cellid], relatedCellsY[cellid], relatedCellsC[cellid]];
    //loop over each axis
    for (var i = 0; i < allRelatedCells.length; i++) {
      //axis we are currently processing
      var relatedAxis = allRelatedCells[i];
      for (var j = 0; j < relatedAxis.length; j++) {
        // if value is blank 
        if ($(relatedAxis[j]).val() == "") {
          calculatePossible(relatedAxis[j]);
          log('updated possible for ' + relatedAxis[j]);
        }
      }
    }
  }

  /*
   * Solve wrapper when cell clicked
   */
  function solveThis() {
    calculateAllPossible();
    simpleSolve('#' + $(this).attr('id'));
    //logic here - we should try cross solve sometimes
  }

  /*
   *  Simple blacklist based solving algorithm
   *  look to related cells, blacklisting possible candidates
   *  if a single unique value is left un-blacklisted it is
   *  chosen.   
   */
  function simpleSolve(cellid) {
    var cellid = cellid;
    var value = $(cellid).val();
    //try to solve
    if (value === '') {
      calculatePossible(cellid);
      var possiblevalues = possible[cellid];
      if (possiblevalues.length === 1) {
        $(cellid).val(possiblevalues[0]);
        $(cellid).removeClass('unsolved');
        $(cellid).addClass('solved');
        log('x' + cellid[1] + 'y' + cellid[2] + ' solved. single possibilty remained.');
        //triggers an update to all possible cells
        calculateAllPossible();
      } else {
        //add to counter for failed solve attempts
        consecutiveFails++;
      }
    } else {
      //value isn't blank so must be solved by user
      $(this).addClass('userSolved');
      $(this).removeClass('unsolved');
    }
  }

  /*
   *  Attempts candidate elimination by comparing possibilities of related cells
   *  for a hidden unique value - AKA 'hidden singles'
   */
  function hiddenSinglesSolve(cellid) {
    calculateAllPossible();
    var cellid = cellid;
    var allRelatedCells = [relatedCellsX[cellid], relatedCellsY[cellid], relatedCellsC[cellid]];

    //loop over each axis
    for (var i = 0; i < allRelatedCells.length; i++) {
      //axis we are currently processing
      var relatedAxis = allRelatedCells[i];

      //how many times 1-9 occur in possibles counts[0] is always going to be 0
      var counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      var cellsInCount = [];

      //Remember to use own cell value in elimination: lack of this was causing
      //incorrect cell values to be chosen.
      if ($(cellid).val() == "") {
        cellsInCount.push(cellid);
        var tmppos = possible[cellid];
        for (var p = 0; p < tmppos.length; p++) {
          //add to the count 
          counts[tmppos[p]]++;
        }
      }

      //loop over each related cell by axis i
      for (var j = 0; j < relatedAxis.length; j++) {

        //only want to deal with unsolved fields!             
        var tmpval = $(relatedAxis[j]).val();
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
            log('x' + foundcell[1] + 'y' + foundcell[2] + ' solved using cross possibility solve.');
            $(foundcell).val(onlyhere[0]);
            $(foundcell).removeClass('unsolved');
            $(foundcell).addClass('crossSolved');
            //call update to remaining possible cells
            calculateAllPossible();
          }
        }
      }
    }
  }

  /*
   *  Attempts to clear the board by running through
   *  all solve algorithms available
   */
  function solveAll() {
    //timer
    var start = new Date().getMilliseconds();

    var unsolved = $(".unsolved").length;
    var attempts = 0;
    consecutiveFails = 0;
    var totalTrys = 0;

    // Run a simple solve until it produces no more results in over a full board pass
    while (unsolved > 0 && consecutiveFails < 162) {
      //loop over each cellid
      for (var i = 0; i < cellids.length; i++) {
        simpleSolve(cellids[i]);
        totalTrys++;
        //escape loop
        if (consecutiveFails > 162)
          break;
      }
      unsolved = $(".unsolved").length;
      attempts++;
    }

    //simple solve ends
    var elapsed = new Date().getMilliseconds() - start;

    //did we do it?
    if (unsolved === 0) {
      log("Solve success in: < " + attempts + " board passes. Total solve trys: " + totalTrys + ". Time taken: " + elapsed + " ms");
    } 
    //try something else
    else{
      //start counting fails again
           
  
      log("Looking for hidden singles...");
      //pass board for hidden singles
      for (var i = 0; i < cellids.length; i++) {
        hiddenSinglesSolve(cellids[i]);
      }
      
      //try another pass with simpleSolve
      log("Trying simple solve...")
      consecutiveFails = 0; 
      while (unsolved > 0 && consecutiveFails < 162) {
        for (var i = 0; i < cellids.length; i++) {
          simpleSolve(cellids[i]);
          if(consecutiveFails == 162)
            break;
        }
        unsolved = $(".unsolved").length;
        attempts++;  
      }
      
      //hidden singles
      elapsed = new Date().getMilliseconds() - start;
      log("Complete in: "+elapsed+" ms.");
      
      unsolved = $(".unsolved").length;
      if(unsolved === 0){
        log("Solution found.");        
        validateSolution();
      }
      else{
        log("Solution not found.");
      }
    }
    
  }

  /*
   *  Checks each cell grouping to make sure we    
   *  havn't dun' goof'd
   */
  function validateSolution() {
    //loop over each axis and make sure there is 1-9 in each and every cell      
    var axis = ['x', 'y', 'c'];
    var failed = false;
    //each axis
    for (var ax = 0; ax < axis.length; ax++) {
      log("Validating groupings by " + axis[ax]);
      var axisid = axis[ax];
      //each axis has 9 cell groups
      for (var i = 0; i < 10; i++) {
        //current grouping 
        var currentgp = axisid + '' + i;
        //tracks out numbers
        var sum = 0;
        var vals = [];
        $('.' + currentgp).each(function() {
          var val = $(this).val();
          if (vals[val] == undefined) {
            //its not there yet so throw it in
            vals[val] = val;
          } else {
            //already found, therefore failed
            failed = true;
            log("Group " + currentgp + " FAILED");
            $('.' + currentgp).addClass("invalid");
          }
        });
      }
    }
    if (failed) {
      log("Validation failed! You suck!!");
    } else {
      log("Congratulation. Solution was valid!");
      $('.grid').removeClass('invalid');
    }
  }
  
  /*
   *  Visually shows related cells
   */
  function toggleHighlighting() {
    if (highlight == 1) {
      $('.grid').each(function() {
        $(this).off('mouseover');
        $(this).off('mouseover');
      });
      $(this).text("Highlight (Off)");
      highlight = 0;
    } else if (highlight == 0) {
      $('.grid').each(function() {
        $(this).mouseover(highLight);
        $(this).mouseout(unhighLight);
        $(this).data('state', 'on');
      });
      $(this).text("Highlight (On)");
      highlight = 1;
    }
  }

  function highLight() {
    var value = $(this).text();
    var x = ".x" + $(this).data('x');
    var y = ".y" + $(this).data('y');
    var cluster = ".c" + $(this).data('cluster');

    //highlight all with same x, y and cluster
    $(cluster).addClass('highlight');
    $(x).addClass('highlight');
    $(y).addClass('highlight');
  }
  function unhighLight() {
    var value = $(this).text();
    var x = ".x" + $(this).data('x');
    var y = ".y" + $(this).data('y');
    var cluster = ".c" + $(this).data('cluster');

    //highlight all with same x, y and cluster
    $(cluster).removeClass('highlight');
    $(x).removeClass('highlight');
    $(y).removeClass('highlight');
  }

  /*
   *  Prints to logging div
   */
  function log(message) {
    $('#log').html(message+'<br/>'+$('#log').html()+'');
    //$('#log').append(message + '<br/>');
  }

  /*
   *  It makes invalid json 
   */
  function presetJSON() {
    log('}');
    $('.grid').each(function() {
      if ($(this).val() != '') {
        log(',"x' + $(this).attr('data-x') + 'y' + $(this).attr('data-y') + '": [ ' + $(this).attr('data-x') + ',' + $(this).attr('data-y') + ',' + $(this).val() + ']');
      }
    });
    log('{');
  }

  /*
   *  It loads presets from json file and adds 
   *  the values to the board.
   */
  function loadPreset() {
    //what preset to load      
    var difficulty = $('#difficulty').val();
    var difficultyPresets = presets[difficulty];
    var cells = difficultyPresets[0];
    for (var key in cells) {
      var tmpcell = cells[key];
      var xclass = '.x' + tmpcell[0];
      var yclass = '.y' + tmpcell[1];
      $(xclass).each(function() {
        if ($(this).attr('data-y') == tmpcell[1]) {
          $(this).val(tmpcell[2]);
          $(this).removeClass('unsolved');
          $(this).addClass('userSolved');
        }
      });
    }
  }

  /*
   *  Figures out which cells belong in which cluster
   *  I don't remember why I needed this...
   */
  function clusterCell(x, y) {
    if (y == 0 || y == 1 || y == 2) {
      //row 1
      if (x == 0 || x == 1 || x == 2) {
        //cluster 1
        return 0;
      } else if (x == 3 || x == 4 || x == 5) {
        //cluster 2
        return 1;
      } else if (x == 6 || x == 7 || x == 8) {
        //cluster 3
        return 2;
      }
    } else if (y == 3 || y == 4 || y == 5) {
      //row 2
      if (x == 0 || x == 1 || x == 2) {
        //cluster 4
        return 3;
      } else if (x == 3 || x == 4 || x == 5) {
        //cluster 5
        return 4;
      } else if (x == 6 || x == 7 || x == 8) {
        //cluster 6
        return 5;
      }
    } else if (y == 6 || y == 7 || y == 8) {
      //row 3
      if (x == 0 || x == 1 || x == 2) {
        //cluster 7
        return 6;
      } else if (x == 3 || x == 4 || x == 5) {
        //cluster 8
        return 7;
      } else if (x == 6 || x == 7 || x == 8) {
        //cluster 9
        return 8;
      }
    }
  }