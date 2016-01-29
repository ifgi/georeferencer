


$(function(){

  $( "#subjectTags" ).click(function(){

    var qt_items = 0;

    $('#subjectTags input:checked').each(function() {
        qt_items++;
    });

    if(qt_items == 0){

      $('#btAddGNDPlace').prop('disabled', true);

    } else {

      $('#btAddGNDPlace').prop('disabled', false);

    }

  });
});

$(function(){

  $( "#placeTags" ).click(function(){

    var qt_items = 0;

    $('#placeTags input:checked').each(function() {
        qt_items++;
    });

    if(qt_items == 0){

      $('#btAddDBpediaPlace').prop('disabled', true);

    } else {

      $('#btAddDBpediaPlace').prop('disabled', false);

    }

  });
});


$(function(){

  $( "#stSuggestions" ).click(function(){

    var qt_items = 0;

    $('#stSuggestions input:checked').each(function() {
        qt_items++;
    });

    if(qt_items == 0){

      $('#btAddDBpediaSuggestions').prop('disabled', true);

    } else {

      $('#btAddDBpediaSuggestions').prop('disabled', false);

    }

  });
});


$(function(){

  $( "#spotlightLinks" ).click(function(){

    var qt_items = 0;

    $('#spotlightLinks input:checked').each(function() {
        qt_items++;
    });

    if(qt_items == 0){

      $('#btAddDBpediaCitations').prop('disabled', true);

    } else {

      $('#btAddDBpediaCitations').prop('disabled', false);

    }

  });
});

$(function(){

  $( "#btFindDBpediaPlaces" ).click(function(){

    if($("#paperMapPlaces").val()!=''){

      $("#placeTags").html("<p>Loading matches for <b>'"+$("#paperMapPlaces").val()+"'</b> in <b>"+$('#languages').find('option:selected').text()+"</b> from the <a href='http://dbpedia.org/sparql' target='_blank'>DBpedia SPARQL Endpoint</a>, please wait...</p>");
      listDBpediaPlaces();


    } else {

      $("#placeTags").html("<br><br>No place name provided.");

    }

  });
});



$(function(){
  $('#btFindGNDPlaces').click(function() {

    $("#subjectTags").html("<br><span>Loading matches for <b>'"+$("#paperMapSubjects").val()+"'</b> from the <a href='http://lobid.org/api' target='_blank'>LOBID API</a>, please wait...</span>");
    queryGNDPlaces();

  });
});


$(function(){
  $('#btSpotlight').click(function() {

    $("#spotlightLinks").html("<br><span>Looking for 'things' in the given text, please wait...</span>");
    queryDbpediaSpotlight();

  });
});


$(function(){
  $( "#btSuggestions" ).click(function(){

    //$("#stSuggestions").html("<br><span>Loading resources matching the given map area and year, please wait ... </span>");
    $("#stSuggestions").html("<p>Loading resources matching the year <b>"+$("#paperMapTime").val()+"</b> in <b>"+$('#languagesSuggestions').find('option:selected').text()+"</b> from the <a href='http://dbpedia.org/sparql' target='_blank'>DBpedia SPARQL Endpoint</a>. It might take a while, please wait...</p>");

      listDBpediaSuggestions();

  });
});


$(function(){
  $('#btSave').click(function() {


    updateEntry();

  });
});

$("#mapAreawkt").change(function(){
  var md = MapDescription.getInstance();
  md.setMapArea($.trim($("#mapAreawkt").val()));
  alert("changed")
});

/*$(function(){
  $( "#btSuggestions" ).click(function(){

    $("#stSuggestions").html("<br><span>Loading resources matching the given map area and year, please wait ... </span>");
    $("#stSuggestions").html("<p>Loading resources matching the year <b>"+$("#paperMapTime").val()+"</b> in <b>"+$('#languages').find('option:selected').text()+"</b> from the <a href='http://dbpedia.org/sparql' target='_blank'>DBpedia SPARQL Endpoint</a>. It might take a while, please wait...</p>");




    if(trans != null){

      var md = MapDescription.getInstance();
      var ewmessages = md.validate()

      if(countErrorMessages(ewmessages)[0] == 0){

        var c = Constants.getInstance();
        var dateSeparator = c.getConstant("DATE_SEPARATOR");
        var year = $.trim($("#paperMapTime").val());

        if(year != null){

          var xyProjArrayBnd = getImageBoundariesInMapCoords(trans, imgModelScaled);
          var xybboxBnd = getBBOX(xyProjArrayBnd);
          var yearStart = "";
          var yearEnd = "";

          if(year.indexOf(dateSeparator) >= 0){

            var yearStrArray = year.split(dateSeparator);
            yearStart = yearStrArray[0];// + "-01-01T00:00:00+00:00";//TODO: Find a better way to make the year valid
            yearEnd = yearStrArray[1];//HACK: Machete kills!

          }else{

            yearStart = year// + "-01-01T00:00:00+00:00";//TODO: Find a better way to make the year valid
            yearEnd = year;//HACK: Machete kills!

          }

          var stRefs = queryDbpediaST(xybboxBnd, yearStart, yearEnd);
          //Adds check boxes for suggestions
          $("#stSuggestions").empty();
          var tmp = new Array();

          for(var i = 0; i < stRefs.length; i++){

            var ref = stRefs[i];
            var subject = ref[0];

            if(tmp.indexOf(subject) < 0){//Avoid subject repetition

              tmp.push(subject);
              var label = ref[1];
              var abst = ref[2];
              $("#stSuggestions").append("<p id='pStTag" + tmp.length +"'><input type='checkbox' id='" + subject + "' value='" + subject + "' title='" + abst + "' class='chMapLinkSuggestion' >" + label + " - <a href='" + subject + "' target='_blank'>view</a> <a href='javascript: void(0)' onclick='removeElement(&quot;pStTag" + tmp.length + "&quot;)'>remove</a></p>");

            }

          }

          if(stRefs.length == 0){

            $("#stSuggestions").html("<br>No resource found for the given map area and year.</span>");

          }
        }else{

          alert("Please fill the map time field in the metadata tab.");

        }

      }else{

        var em = " ";

        for (var i = 0; i < ewmessages.length; i++){

          var m = ewmessages[i];

          if(m[0] == "ERROR"){

            em = em + " " + m[1];

          }

          alert("ERRORS:" + em);
        }
      }
    }
  });
});
*/
