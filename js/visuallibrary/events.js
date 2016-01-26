


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

  $( "#btFindDBpediaPlaces" ).click(function(){

    if($("#paperMapPlaces").val()!=''){

      $("#placeTags").html("<p>Loading matches for <b>'"+$("#paperMapPlaces").val()+"'</b> in <b>"+$('#languages').find('option:selected').text()+"</b> from the <a href='http://dbpedia.org/sparql' target='_blank'>DBpedia SPARQL Endpoint</a>, please wait...</p>");
      listDBpediaPlaces();


    } else {

      $("#placeTags").html("<br><br>No place name provided.");

    }

  });
});
