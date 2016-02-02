


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
