var currentEndpoint = "";
var currentNamedGraph = "";
var currentMapID = "";
var currentMapImage = "";
var currentWKT = "";
var newWKT="";
var currentMinBBOX = "";

var currentMapSubject = "";
var currentDescription ="";
var currentYear="";
var currentScale="";
var currentSize="";
var currentPresentation="";
var currentPlaces="";
var currentLinks="";
var currentCitations ="";

function init(){


  $('#paperMapCreator').tagit();
  $('#sameAsTags').tagit();
	$('#dbpediaPlaces').tagit();
	$('#dbpediaLinks').tagit();
	$('#dbpediaSuggestions').tagit();
  $('#gndInfo').tagit();


  currentMapID = getQueryVariable("id");
  currentEndpoint = getQueryVariable("endpoint");
  currentNamedGraph = getQueryVariable("graph");
  currentMapImage = getQueryVariable("image");

	if(getQueryVariable("id")!=null){

		executeQuery(currentMapID);
		listSameAs(currentMapID);
		listAuthors(currentMapID);
		listGNDInfo(currentMapID);
    listLinks(currentMapID);

		if(currentMapImage!=null){

      loadVLimage(currentMapImage);

		} else {

			alert("Image URL not provided.");
		}

	}


}

function loadVLimage(path){

    var imageUrl = path;

    if(isUrlOfImage(imageUrl)){
      var image = new Image();
      image.onload = function(){

        //Loads the new image to the map
        imgModelOriginal = new ImageModel(imageUrl, this.width, this.height);
        imgModelScaled = new ScaledImage(imgModelOriginal, imageMapMaxSize);
        var scaleBounds = new Array();
        scaleBounds[0] = imgModelScaled.getScaledImage().getCartesianLowerLeft_Image1Q().reverse();
        scaleBounds[1] = imgModelScaled.getScaledImage().getCartesianUpperRight_Image1Q().reverse();

        if(imageMapLayer != null){
          mapImage.removeLayer(imageMapLayer);//Removes the last loaded image
        }
        imageMapLayer = new L.imageOverlay(imageUrl, scaleBounds);
        imageMapLayer.addTo(mapImage);
        mapImage.setView([imgModelScaled.getScaledImage().getHeight()/2, imgModelScaled.getScaledImage().getWidth()/2], 6);//Zoom to image center

      }

      image.src = imageUrl;
      var md = MapDescription.getInstance();
      md.setImageUrl(imageUrl);


    }else{
      alert("Invalid URL! \n" + path);
    }


}



function updateEntry(mapID){

  var sparqlUpdate = "";

  if(currentDescription != $('#taMapDescription').val()){

     sparqlUpdate = "DELETE DATA FROM <"+currentNamedGraph+"> { <"+currentMapSubject+"> <http://purl.org/dc/terms/description> \"" + currentDescription + "\"^^<http://www.w3.org/2001/XMLSchema#string>}\n";
     sparqlUpdate = sparqlUpdate + "INSERT DATA INTO <"+currentNamedGraph+"> { <"+currentMapSubject+"> <http://purl.org/dc/terms/description> \"" + $('#taMapDescription').val().replace(/"/gi,'&quot;') + "\"^^<http://www.w3.org/2001/XMLSchema#string>}\n";

  }

  if(currentScale != $('#paperMapScale').val()){

    sparqlUpdate = sparqlUpdate + "DELETE DATA FROM <"+currentNamedGraph+"> { <"+currentMapSubject+"> <http://www.geographicknowledge.de/vocab/maps#hasScale> \"" + encode_utf8(currentScale) + "\"^^<http://www.w3.org/2001/XMLSchema#string>}\n";
    sparqlUpdate = sparqlUpdate + "INSERT DATA INTO <"+currentNamedGraph+"> { <"+currentMapSubject+"> <http://www.geographicknowledge.de/vocab/maps#hasScale> \"" + encode_utf8($('#paperMapScale').val()) + "\"^^<http://www.w3.org/2001/XMLSchema#string>}\n";

  }

  if(currentSize != $('#paperMapSize').val()){

    sparqlUpdate = sparqlUpdate + "DELETE DATA FROM <"+currentNamedGraph+"> { <"+currentMapSubject+"> <http://www.geographicknowledge.de/vocab/maps#mapSize> \"" + encode_utf8(currentSize) + "\"^^<http://www.w3.org/2001/XMLSchema#string>}\n";
    sparqlUpdate = sparqlUpdate + "INSERT DATA INTO <"+currentNamedGraph+"> { <"+currentMapSubject+"> <http://www.geographicknowledge.de/vocab/maps#mapSize> \"" + encode_utf8($('#paperMapSize').val()) + "\"^^<http://www.w3.org/2001/XMLSchema#string>}\n";

  }

  if(currentPresentation != $('#url').val()){

    sparqlUpdate = sparqlUpdate + "DELETE DATA FROM <"+currentNamedGraph+"> { <"+currentMapSubject+"> <http://www.geographicknowledge.de/vocab/maps#presentation> \"" + encode_utf8(currentPresentation) + "\"^^<http://www.w3.org/2001/XMLSchema#string>}\n";
    sparqlUpdate = sparqlUpdate + "INSERT DATA INTO <"+currentNamedGraph+"> { <"+currentMapSubject+"> <http://www.geographicknowledge.de/vocab/maps#presentation> \"" + encode_utf8($('#url').val()) + "\"^^<http://www.w3.org/2001/XMLSchema#string>}\n";

  }


  if(currentPlaces != $('#gndInfo').val()){

    var placesArray = currentPlaces.split(",");

    for (var i = 0; i < placesArray.length; i++) {

      if(placesArray[i].trim()!="" ){

          sparqlUpdate = sparqlUpdate + "DELETE DATA FROM <"+currentNamedGraph+"> { <"+currentMapSubject+"> <http://purl.org/dc/terms/references> <" + placesArray[i].trim() + ">}\n";

      }

    }

    var newPlacesArray = $('#gndInfo').val().split(",");

    for (var i = 0; i < newPlacesArray.length; i++) {

      if(newPlacesArray[i].trim()!=""){

          sparqlUpdate = sparqlUpdate + "INSERT DATA INTO <"+currentNamedGraph+"> { <"+currentMapSubject+"> <http://purl.org/dc/terms/references> <" + newPlacesArray[i].trim() + ">}\n";

        }

    }


  }

  if(currentLinks != $('#dbpediaLinks').val()){

    var linksArray = currentLinks.split(",");

    for (var i = 0; i < linksArray.length; i++) {

      if(linksArray[i].trim()!=""){

          sparqlUpdate = sparqlUpdate + "DELETE DATA FROM <"+currentNamedGraph+"> { <"+currentMapSubject+"> <http://www.geographicknowledge.de/vocab/maps#mapsPhenomenon> <" + linksArray[i].trim() + ">}\n";

      }

    }

    var newLinksArray = $('#dbpediaLinks').val().split(",");

    for (var i = 0; i < newLinksArray.length; i++) {

      if(newLinksArray[i].trim()!=""){

          sparqlUpdate = sparqlUpdate + "INSERT DATA INTO <"+currentNamedGraph+"> { <"+currentMapSubject+"> <http://www.geographicknowledge.de/vocab/maps#mapsPhenomenon> <" + newLinksArray[i].trim() + ">}\n";

      }

    }

  }


  if(currentWKT!=newWKT && newWKT!=""){

      sparqlUpdate = sparqlUpdate + "DELETE WHERE { GRAPH <"+currentNamedGraph+"> {<"+currentMapSubject+"> <http://www.geographicknowledge.de/vocab/maps#mapsArea> ?geometry . ?geometry <http://www.opengis.net/ont/geosparql/1.0#asWKT> ?wkt } }\n\n";
      sparqlUpdate = sparqlUpdate + "INSERT DATA { GRAPH <"+currentNamedGraph+"> {<"+currentMapSubject+"> <http://www.geographicknowledge.de/vocab/maps#mapsArea> _:geometry . _:geometry <http://www.opengis.net/ont/geosparql/1.0#asWKT> \""+ newWKT +"\"^^<http://www.opengis.net/ont/geosparql#wktLiteral> } }";
  }

  if(sparqlUpdate==""){

    alert("No change detected for the current map.");

  } else {

    storeChanges(sparqlUpdate);
    console.log("SPARQL Update:\n\n\n"+sparqlUpdate);

  }


}



function listGNDInfo(mapID) {

  	var sparqlQuery = $.sparql()
  			  .prefix("maps","http://www.geographicknowledge.de/vocab/maps#")
  			  .prefix("dnb","http://d-nb.info/standards/elementset/gnd#")
          .prefix("rdfs","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
          .prefix("dct","http://purl.org/dc/terms/")
  			  .select(["?map", "?gndPlace", "?gndPlaceName"])
  			  	.graph("<"+currentNamedGraph+">")
  				  	.where("?map","a","maps:Map")
              .where("?map","rdfs:ID","?vlid")
              .where("?map","dct:references","?gndPlace")
              .where("?map","dct:references","?gndPlace")
              .optional().where("?gndPlace","dnb:preferredNameForThePlaceOrGeographicName","?gndPlaceName").end().end();

              sparqlQuery.filter("?vlid='"+mapID+"'");


    console.log("SPARQL Encoded GND Info (Places) -> "+ sparqlQuery.serialiseQuery());
    console.log("Sending SPARQL...");


    sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), currentEndpoint, gndInfoCallback, false);

    console.log("SPARQL executed");

}

function gndInfoCallback(str) {

	console.log("#DEBUG query.js -> GND Info (Places) query executed.");


	var jsonObj = eval('(' + str + ')');
	console.log(jsonObj);

  var gndInfoString ="";

	for(var i = 0; i<  jsonObj.results.bindings.length; i++) {

			if (typeof jsonObj.results.bindings[i].gndPlace !== 'undefined') {

        //gndInfoString = gndInfoString +  jsonObj.results.bindings[i].gndPlace.value + ", ";
        $('#gndInfo').tagit("createTag",jsonObj.results.bindings[i].gndPlace.value);

			}

  }

  currentPlaces = $('#gndInfo').val();

  //$('#gndInfo').val(gndInfoString);
  //$('#gndInfo').tagit();

}

function listSameAs(mapID) {

  	var sparqlQuery = $.sparql()
  			  .prefix("maps","http://www.geographicknowledge.de/vocab/maps#")
  			  .prefix("owl","http://www.w3.org/2002/07/owl#")
  			  .prefix("dnb","http://d-nb.info/standards/elementset/gnd#")
          .prefix("rdfs","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
  			  .select(["?map", "?sameAs", "?authorName"])
  			  	.graph("<"+currentNamedGraph+">")
  				  	.where("?map","a","maps:Map")
              .where("?map","rdfs:ID","?vlid")
              .where("?map","owl:sameAs","?sameAs").end();

              sparqlQuery.filter("?vlid='"+mapID+"'");


    console.log("SPARQL Encoded (sameAs) -> "+ sparqlQuery.serialiseQuery());
    console.log("Sending SPARQL...");


    sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), currentEndpoint, sameAsCallback, false);

    console.log("SPARQL executed");

}

function sameAsCallback(str) {

	console.log("#DEBUG query.js -> sameAs query executed.");


	var jsonObj = eval('(' + str + ')');
	console.log(jsonObj);

  //var sameAsString ="";

	for(var i = 0; i<  jsonObj.results.bindings.length; i++) {

			if (typeof jsonObj.results.bindings[i].sameAs !== 'undefined') {

        //sameAsString = sameAsString +  jsonObj.results.bindings[i].sameAs.value + ", ";
          $('#sameAsTags').tagit("createTag",jsonObj.results.bindings[i].sameAs.value.trim());

			}

  }


  //$('#sameAsTags').val(sameAsString);
  //$('#sameAsTags').inputTags();
  //$("#sameAsTags").prop('disabled', true);


}

function listAuthors(mapID) {

  	var sparqlQuery = $.sparql()
  			  .prefix("maps","http://www.geographicknowledge.de/vocab/maps#")
  			  .prefix("dct","http://purl.org/dc/terms/")
  			  .prefix("dnb","http://d-nb.info/standards/elementset/gnd#")
          .prefix("rdfs","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
  			  .select(["?map", "?author", "?authorName"])
  			  	.graph("<"+currentNamedGraph+">")
  				  	.where("?map","a","maps:Map")
              .where("?map","rdfs:ID","?vlid")
              .where("?map","dct:creator","?author")
              .optional().where("?author","dnb:variantNameForThePerson","?authorName").end().end();

              sparqlQuery.filter("?vlid='"+mapID+"'");


    console.log("SPARQL Encoded -> "+ sparqlQuery.serialiseQuery());
    console.log("Sending SPARQL...");


    sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), currentEndpoint, authorsCallback, false);

    console.log("SPARQL executed");

}

function authorsCallback(str) {

	console.log("#DEBUG query.js -> authors query executed.");


	var jsonObj = eval('(' + str + ')');
	console.log(jsonObj);


	for(var i = 0; i<  jsonObj.results.bindings.length; i++) {

		if (typeof jsonObj.results.bindings[i].map !== 'undefined') {

			if (typeof jsonObj.results.bindings[i].author !== 'undefined') {

        $('#paperMapCreator').tagit("createTag",jsonObj.results.bindings[i].author.value);
			}

    }

  }

  //$('#paperMapCreator').val(authorsString);
  //$('#paperMapCreator').inputTags();

}

function executeQuery(mapID) {

  	var sparqlQuery = $.sparql()
  			  .prefix("maps","http://www.geographicknowledge.de/vocab/maps#")
  			  .prefix("geo","http://www.opengis.net/ont/geosparql/1.0#")
  			  .prefix("xsd","http://www.w3.org/2001/XMLSchema#")
  			  .prefix("dct","http://purl.org/dc/terms/")
  			  .prefix("geof","http://www.opengis.net/def/function/geosparql/")
  			  .prefix("sf","http://www.opengis.net/ont/sf#")
          .prefix("rdfs","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
  			  .select(["?map", "?title", "?scale", "?wkt", "?picture", "?year", "?description", "?presentation", "?size", "?vlid"])
  			  	.graph("<"+currentNamedGraph+">")
  				  	.where("?map","a","maps:Map")
  				  	.where("?map","maps:digitalImageVersion","?picture")
  				  	.where("?map","maps:title","?title")
  				  	.where("?map","maps:presentation","?presentation")
  				  	.where("?map","maps:hasScale","?scale")
  				  	.where("?map","maps:mapsTime","?time")
              .where("?map","maps:mapSize","?size")
  				  	.where("?time","xsd:gYear","?year")
              .where("?map","rdfs:ID","?vlid")
              .optional().where("?map","maps:mapsArea","?geometry")
                         .where("?geometry","geo:asWKT","?wkt").end()
              .optional().where("?map","maps:mapsArea","?area").end()
              .optional().where("?map","dct:description","?description").end().end();

              sparqlQuery.filter("?vlid='"+mapID+"'");


    console.log("SPARQL Encoded -> "+ sparqlQuery.serialiseQuery());
    console.log("Sending SPARQL...");


    sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), currentEndpoint, queryCallback, false);

    console.log("SPARQL executed");


}

function queryCallback(str) {

	console.log("#DEBUG query.js -> main query executed.");

	//** Convert result to JSON
	var jsonObj = eval('(' + str + ')');

	console.log(jsonObj);

  var counter = 0;
	for(var i = 0; i<  jsonObj.results.bindings.length; i++) {


    counter++;
		//** Creates list item.
		if (typeof jsonObj.results.bindings[i].map !== 'undefined') {

      currentMapSubject = jsonObj.results.bindings[i].map.value;

      var wkt ='';
			var description = '';
			var title = '';
			var picture = '';
			var mapVar = '';
			var scale = '';
			var year = '';
			var presentation = '';
			var size = '';
      var vlid = '';

			if (typeof jsonObj.results.bindings[i].description !== 'undefined') {
				description = jsonObj.results.bindings[i].description.value;
        currentDescription = jsonObj.results.bindings[i].description.value;
			}

			if (typeof jsonObj.results.bindings[i].title !== 'undefined') {
				title = jsonObj.results.bindings[i].title.value;

			}

			if (typeof jsonObj.results.bindings[i].presentation !== 'undefined') {
				presentation = jsonObj.results.bindings[i].presentation.value;
        currentPresentation = jsonObj.results.bindings[i].presentation.value;
			}

			if (typeof jsonObj.results.bindings[i].picture !== 'undefined') {
				picture = jsonObj.results.bindings[i].picture.value;
			}

			if (typeof jsonObj.results.bindings[i].map !== 'undefined') {
				mapVar = jsonObj.results.bindings[i].map.value;
			}

			if (typeof jsonObj.results.bindings[i].scale !== 'undefined') {
				scale = jsonObj.results.bindings[i].scale.value;
        currentScale = jsonObj.results.bindings[i].scale.value;
			}

			if (typeof jsonObj.results.bindings[i].year !== 'undefined') {
				year = jsonObj.results.bindings[i].year.value;
			}

			if (typeof jsonObj.results.bindings[i].size !== 'undefined') {
        size = jsonObj.results.bindings[i].size.value;
        currentSize = jsonObj.results.bindings[i].size.value;
			}

      if (typeof jsonObj.results.bindings[i].vlid !== 'undefined') {
				vlid = jsonObj.results.bindings[i].vlid.value;
			}

      if (typeof jsonObj.results.bindings[i].wkt !== 'undefined') {


        var polyStyle = {color: "#FF7800", weight: 2};


        currentWKT = jsonObj.results.bindings[i].wkt.value;

        var geojson = Terraformer.WKT.parse(currentWKT.replace("<http://www.opengis.net/def/crs/EPSG/0/4326>",""));
        var layer = L.geoJson(geojson,{style: polyStyle});

        layer.addTo(map);
        map.fitBounds(layer.getBounds());

      }


      $("#vlid").val(vlid);
      $("#paperMapTitle").val(title);
      $("#taMapDescription").val(description.replace(/&quot;/gi,'"'));

      $("#paperMapTime").val(year);
      $("#paperMapScale").val(scale);
      $("#paperMapSize").val(size);
      $("#url").val(presentation);

    }

    }
}


function storeChanges(sparqlUpdate){

  try{

      console.log(sparqlUpdate);

        $.ajax({
                type:       "post",
                url:        currentEndpoint,
                data:       {action:'add', update:sparqlUpdate}});

       alert("Map successfully updated.");

  }catch(err){
    alert(err);
    console.log(err);
  }

}

function listDBpediaPlaces(placeName) {

  	var sparqlQuery = $.sparql()
  			  .prefix("dbp-ont","http://dbpedia.org/ontology/")
  			  .prefix("geo","http://www.w3.org/2003/01/geo/wgs84_pos#")
          .prefix("rdfs","http://www.w3.org/2000/01/rdf-schema#")
          .prefix("xsd","http://www.w3.org/2001/XMLSchema#")
          .prefix("foaf","http://xmlns.com/foaf/0.1/")
  			  .select(["?place", "?label", "?wikiPage" ,"(CONCAT('POINT(', STR(?long), ' ', STR(?lat), ')') AS ?wkt)"])
  				  	.where("?place","a","dbp-ont:PopulatedPlace")
              .where("?place","rdfs:label","?label")
              .optional().where("?place","geo:lat","?lat").end()
              .optional().where("?place","geo:long","?long").end()
              .optional().where("?place","foaf:isPrimaryTopicOf","?wikiPage").end();


              sparqlQuery.filter("REGEX(STR(LCASE(?label)), '"+$("#paperMapPlaces").val().toLowerCase()+"')");

              if($('#languages').find('option:selected').val()!='all'){

                sparqlQuery.filter("LANGMATCHES(LANG(?label), '"+$('#languages').find('option:selected').val()+"')");

              }

    console.log("SPARQL Encoded -> "+ sparqlQuery.serialiseQuery());
    console.log("Sending SPARQL...");


    sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), "http://dbpedia.org/sparql", dbpediaPlacesCallback, false);

    console.log("SPARQL executed");


}

function dbpediaPlacesCallback(str) {

	console.log("#DEBUG query.js -> DBpedia places query executed.");


	var jsonObj = eval('(' + str + ')');
	console.log(jsonObj);



  if(jsonObj.results.bindings.length>0){

    $("#placeTags").html("");

    for(var i = 0; i<  jsonObj.results.bindings.length; i++) {

  		if (typeof jsonObj.results.bindings[i].place !== 'undefined') {

        var place = jsonObj.results.bindings[i].place.value;
        var label = jsonObj.results.bindings[i].label.value;
        var wikiPage ="";

        if (typeof jsonObj.results.bindings[i].wikiPage !== 'undefined') {

            wikiPage = jsonObj.results.bindings[i].wikiPage.value;

        }


        if(jsonObj.results.bindings[i].wkt.value != 'POINT( )'){

          $("#placeTags").append("<p id='pSuggestedPlaceTag" + i +"'><input type='checkbox' id='" + decodeURI(place) + "' value='" + decodeURI(label) + "' class='chPlaceSuggestion' >" +
                                  decodeURI(label) + " - <a href='" + decodeURI(place) + "' target='_blank'><img src='img/rdf.png' style='width: 2%; height: auto;'></a> <a href='javascript: void(0)' onclick='removeElement(&quot;pSuggestedPlaceTag" + i
                                  + "&quot;)'><img src='img/delete.png' style='width: 2%; height: auto;'></a> <a target='_blank' href='http://ifgi.uni-muenster.de/~j_jone02/istg/locator.html?wkt="+jsonObj.results.bindings[i].wkt.value+
                                  "'> <img src='img/globe2.png' style='width: 2.2%; height: auto;'></a><a target='_blank' href='"+wikiPage+"'><img src='img/wikipedia.png' style='width: 2.5%; height: auto;'></a></p>");

        } else {
          //alert(label);
        $("#placeTags").append("<p id='pSuggestedPlaceTag" + i +"'><input type='checkbox' id='" + place + "' value='" + decodeURI(place) + "' class='chPlaceSuggestion' >" +
                                decodeURI(label) + " - <a href='" + decodeURI(place) + "' target='_blank'><img src='img/rdf.png' style='width: 2%; height: auto;'></a> <a href='javascript: void(0)' onclick='removeElement(&quot;pSuggestedPlaceTag" + i
                                + "&quot;)'><img src='img/delete.png' style='width: 2%; height: auto;'></a><a target='_blank' href='"+wikiPage+"'><img src='img/wikipedia.png' style='width: 2.5%; height: auto;'></a></p>");
        }

      }

    }

  } else {

    $("#placeTags").html("<p>No match found for '<b>"+$("#paperMapPlaces").val()+"</b>'</p>");

  }
}

function queryDbpediaSpotlight(){

  paperMapDescription = $.trim($("#descriptionSpotlight").val());

  $.ajax({
    //Uses DBpedia spotlight
    url: "http://spotlight.sztaki.hu:2222/rest/annotate?text=" + escape(paperMapDescription) + "&confidence=0.0&support=00",
    headers: {
      Accept : "application/json; charset=utf-8",
      "Content-Type": "text/plain; charset=utf-8"
    },
    }).done(function ( data ) {

      $("#descriptionTags").html("");

      var tmp = new Array();

      if(data.Resources != null){

        $("#spotlightLinks").html("");

        for(var i = 0; i < data.Resources.length; i++){

          var obj = data.Resources[i];
          var subject = obj["@URI"];

          if(tmp.indexOf(subject) < 0){//Avoid subject repetition

            tmp.push(subject);
            //var originalText = obj["@surfaceForm"];
            //Gets the URL last part
            var matchedText = subject.substring(subject.lastIndexOf("/") + 1, subject.length);
            //Creates the checkboxes
            $("#spotlightLinks").append("<p id='pDescriptionTag" + tmp.length +"'><input type='checkbox' id='" + subject +
                                                                                                      "' value='" + subject +
                                                                                                      "' class='chDescriptionSuggestion' >" + matchedText +
                                                                                                      " - <a href='" + subject + "' target='_blank'><img src='img/rdf.png' style='width: 2%; height: auto;'></a> <a href='javascript: void(0)' onclick='removeElement(&quot;pDescriptionTag" + tmp.length + "&quot;)'><img src='img/delete.png' style='width: 2%; height: auto;'></a></p>");
            //Completes the subject with the label and abstract -getDbpediaLabelAbstract();
          }
        }
      } else {

        $("#spotlightLinks").html("<p>No matches found for the given text.</p>");

      }
    }
  );

}

function listLinks(mapID) {

  	var sparqlQuery = $.sparql()
  			  .prefix("maps","http://www.geographicknowledge.de/vocab/maps#")
  			  .prefix("dct","http://purl.org/dc/terms/")
  			  .prefix("dnb","http://d-nb.info/standards/elementset/gnd#")
          .prefix("rdfs","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
  			  .select(["?map", "?link"])
  			  	.graph("<"+currentNamedGraph+">")
  				  	.where("?map","a","maps:Map")
              .where("?map","rdfs:ID","?vlid")
              .where("?map","maps:mapsPhenomenon","?link").end();

              sparqlQuery.filter("?vlid='"+mapID+"'");


    console.log("SPARQL Encoded -> "+ sparqlQuery.serialiseQuery());
    console.log("Sending SPARQL...");


    sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), currentEndpoint, linksCallback, false);

    console.log("SPARQL executed");

}

function linksCallback(str) {

	console.log("#DEBUG query.js -> links query executed.");

	var jsonObj = eval('(' + str + ')');
	console.log(jsonObj);

	for(var i = 0; i<  jsonObj.results.bindings.length; i++) {

		if (typeof jsonObj.results.bindings[i].map !== 'undefined') {

			if (typeof jsonObj.results.bindings[i].link !== 'undefined') {

        $('#dbpediaLinks').tagit("createTag",jsonObj.results.bindings[i].link.value);

			}


    }
  }

  currentLinks = $('#dbpediaLinks').val();

}


function listCitations(mapID) {

  	var sparqlQuery = $.sparql()
  			  .prefix("maps","http://www.geographicknowledge.de/vocab/maps#")
  			  .prefix("dct","http://purl.org/dc/terms/")
  			  .prefix("dnb","http://d-nb.info/standards/elementset/gnd#")
          .prefix("rdfs","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
  			  .select(["?map", "?link"])
  			  	.graph("<"+currentNamedGraph+">")
  				  	.where("?map","a","maps:Map")
              .where("?map","rdfs:ID","?vlid")
              .where("?map","maps:mapsPhenomenon","?link").end();

              sparqlQuery.filter("?vlid='"+mapID+"'");


    console.log("SPARQL Encoded -> "+ sparqlQuery.serialiseQuery());
    console.log("Sending SPARQL...");


    sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), currentEndpoint, linksCallback, false);

    console.log("SPARQL executed");

}

function closePopup(popup){

  //document.getElementById('placesPopup').style.display='none';document.getElementById('fade').style.display='none'
  $('#'+popup).css("display","none");
  $('#fade').css("display","none");

}

function openPopup(popup){

  $('#'+popup).css("display","block");
  $('#fade').css("display","block");

  var valid = true;

  $('#stSuggestions').html("<br>");
  $('#descriptionSpotlight').val($('#taMapDescription').val());

  if(newWKT == ""){

      $('#btSuggestions').prop('disabled', true);
      $('#btToggleSuggestionTags').prop('disabled', true);

      $('#stSuggestions').append("<p>Map <b>area</b> not provided. Please, draw a map area using the map tools on the bottom-left side of the screen and try again.</p>")
      valid = false;
  }

  if($("#paperMapTime").val().trim()==""){

    $('#btSuggestions').prop('disabled', true);
    $('#btToggleSuggestionTags').prop('disabled', true);

    $('#stSuggestions').append("<p>Map <b>year</b> not provided.</p>")
    valid = false;
  }

  if(valid){

      $('#btSuggestions').prop('disabled', false);
      $('#btToggleSuggestionTags').prop('disabled', false);
  }


}




function addPlacesGND(){

  var placesString = "";
  var currenPlaces = $('#gndInfo').val();
  var qt_items = 0;

  $('#subjectTags input:checked').each(function() {



      //if(currenPlaces.indexOf($(this).attr('id')!=-1) && placesString.indexOf($(this).attr('id')!=-1)){

        $('#gndInfo').tagit('createTag', $(this).attr('id'));
        qt_items++;

      //} else {

      //  alert("Place already inserted!\n\nGND ID: " + $(this).attr('id') + "\nPlace Name: " +  $(this).attr('value')+"\n");

      //}
  });

    //$('#gndInfoContainer').html('<input type="text" id="gndInfo">');
    //$('#gndInfo').val(currenPlaces + placesString);
    //$('#gndInfo').inputTags();


    alert("Total places inserted: "+ qt_items);

}

function addPlacesDBpedia(){

  var placesString = "";
  var currenPlaces = $('#gndInfo').val();
  var qt_items = 0;

  $('#placeTags input:checked').each(function() {

        //if(currenPlaces.indexOf($(this).attr('id')!=-1) && placesString.indexOf($(this).attr('id')!=-1)){

        $('#gndInfo').tagit('createTag', $(this).attr('id'));
        qt_items++;

      //} else {

        //alert("Place already inserted!\n\nDBpedia Subject: " + $(this).attr('id') + "\nPlace Name: " +  $(this).attr('value')+"\n");

      //}
  });

    //$('#gndInfoContainer').html('<input type="text" id="gndInfo">');
    //$('#gndInfo').val(currenPlaces + placesString);
    //$('#gndInfo').inputTags();

    alert("Total places inserted: "+ qt_items);

}

function addSuggestionsDBpedia(){

  var linksString = "";
  var currentLinks = $('#dbpediaLinks').val();
  var qt_items = 0;

  $('#stSuggestions input:checked').each(function() {

      console.log("opt -> "+$(this).attr('id'));

      //if(currentLinks.indexOf($(this).attr('id')!=-1) && linksString.indexOf($(this).attr('id')!=-1)){


        $('#dbpediaLinks').tagit('createTag', $(this).attr('id'));
        qt_items++;

      //} else {

        //alert("Resource already inserted!\n\nDBpedia Subject: " + $(this).attr('id') + "\nLabel: " +  $(this).attr('value')+"\n");

      //}
  });

    alert("Total resources inserted: "+ qt_items);

}

function addCitationsDBpedia(){

  //var linksString = "";
  //var currentLinks = $('#gndInfo').val();
  var qt_items = 0;

  $('#spotlightLinks input:checked').each(function() {

      console.log("opt -> "+$(this).attr('id'));

      //if(currentPlaces.indexOf($(this).attr('id')!=-1) && $('#gndInfo').val().indexOf($(this).attr('id')!=-1)){

        $('#gndInfo').tagit('createTag', $(this).attr('id'));

        qt_items++;

      //} else {

        //alert("Resource already inserted!\n\nDBpedia Subject: " + $(this).attr('id') + "\nLabel: " +  $(this).attr('value')+"\n");

      //}
  });

    //$('#citationsContainer').html('<input type="text" id="dbpediaSuggestions">');
    //$('#dbpediaSuggestions').val(currentLinks + linksString);
    //$('#dbpediaSuggestions').inputTags();

    alert("Total resources inserted: "+ qt_items);

}

function encode_utf8(rohtext) {
     // dient der Normalisierung des Zeilenumbruchs
     rohtext = rohtext.replace(/\r\n/g,"\n");
     var utftext = "";
     for(var n=0; n<rohtext.length; n++)
         {
         // ermitteln des Unicodes des  aktuellen Zeichens
         var c=rohtext.charCodeAt(n);
         // alle Zeichen von 0-127 => 1byte
         if (c<128)
             utftext += String.fromCharCode(c);
         // alle Zeichen von 127 bis 2047 => 2byte
         else if((c>127) && (c<2048)) {
             utftext += String.fromCharCode((c>>6)|192);
             utftext += String.fromCharCode((c&63)|128);}
         // alle Zeichen von 2048 bis 66536 => 3byte
         else {
             utftext += String.fromCharCode((c>>12)|224);
             utftext += String.fromCharCode(((c>>6)&63)|128);
             utftext += String.fromCharCode((c&63)|128);}
         }
     return utftext;
 }

 function sparqlQueryJson(queryStr, endpoint, callback, isDebug) {

 	var querypart = "query=" + escape(queryStr);

 	//** Get our HTTP request object.
 	var xmlhttp = null;

 	if(window.XMLHttpRequest) {
 		xmlhttp = new XMLHttpRequest();
 	} else if(window.ActiveXObject) {
 		//** Code for older versions of IE, like IE6 and before.
 		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
 	} else {
 		alert('Perhaps your browser does not support XMLHttpRequests?');
 }


 	//** Set up a POST with JSON result format.
 	xmlhttp.open('POST', endpoint, true); // GET can have caching probs, so POST
 	xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
 	xmlhttp.setRequestHeader("Accept", "application/sparql-results+json");


 	//** Set up callback to get the response asynchronously.
 	xmlhttp.onreadystatechange = function() {

 	if(xmlhttp.readyState == 4) {
 		if(xmlhttp.status == 200) {
 			   //** Do something with the results
 			   if(isDebug) alert(xmlhttp.responseText);
 				   callback(xmlhttp.responseText);
 			 } else {
 				   //** Some kind of error occurred.
 				   alert("[INTERNAL ERROR] Sparql query error: " + xmlhttp.status + " " + xmlhttp.responseText);
 	 	}
 	}
 };

 //** Send the query to the endpoint.
 xmlhttp.send(querypart);

 };

 function getQueryVariable(variable) {
   var query = window.location.search.substring(1);
   var vars = query.split("&");
   for (var i=0;i<vars.length;i++) {
     var pair = vars[i].split("=");
     if (pair[0] == variable) {
       return pair[1];
     }
 }
}

//Variables and functions for loading spin
var opts = {
  lines: 13, // The number of lines to draw
  length: 20, // The length of each line
  width: 10, // The line thickness
  radius: 30, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#000', // #rgb or #rrggbb or array of colors
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: false, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: '50%', // Top position relative to parent
  left: '50%' // Left position relative to parent
};

function showSpin(div){


	target = document.getElementById(div);
	spinner = new Spinner(opts).spin(target);

	target.appendChild(spinner.el);

}

function hideSpin(){

	spinner.stop();

}


function DELETEqueryDbpediaST(xybbox, yearStart, yearEnd){

  var res = new Array();

  var abstractLength = c.getConstant("ABSTRACT_LENGTH");
  var sq = new SparqlQuery();
  var query = c.getConstant("PREFIXES") + " " + c.getConstant("QUERY_BOX_YEAR");

  var xMin = xybbox[0];
  var yMin = xybbox[1];
  var xMax = xybbox[2];
  var yMax = xybbox[3];

  query = query.replace("<PARAM_XMIN>", xMin);
  query = query.replace("<PARAM_YMIN>", yMin);
  query = query.replace("<PARAM_XMAX>", xMax);
  query = query.replace("<PARAM_YMAX>", yMax);
  query = replaceAll("<PARAM_YEAR_START>", yearStart, query);
  query = replaceAll("<PARAM_YEAR_END>", yearEnd, query);

  try{
    //Fails when DBpedia is offline - You don't say!
    console.log("queryDbpediaST -> "+query);

    var js = sq.sendSparqlQuery(query, c.getConstant("DBPEDIA_SPARQL"), "");
    if(js.results.bindings.length < 1){

      $("#stSuggestions").html("<br>No resource found for the given map area and year.</span>");

    }

    for(var i = 0; i < js.results.bindings.length; i++){
      var subject = js.results.bindings[i].subject.value;
      var label = js.results.bindings[i].label.value;
      var abst = js.results.bindings[i].abst.value;
      abst = abst.substring(0, abstractLength) + "...";
      var tmpArray = new Array(subject, label, abst);
      res.push(tmpArray);
    }

  }catch(err){
    console.log(err);
  }
  return res;

}



function queryGNDPlaces(){

  paperMapPlaces = $.trim($("#paperMapSubjects").val());
  $.ajax({
    //Uses LOBID
    url: "http://lobid.org/subject",
    dataType : "jsonp",
    data : {
      name : paperMapPlaces,
      format : "full"
    },
    success : function(data) {

      $("#subjectTags").html("");

      var tmp = new Array();
      if(data != null && data.length > 1){
        for(var i = 1; i < data.length; i++){
          //lobidSubjectCounter = lobidSubjectCounter + 1;
          var obj = data[i];
          var id = obj["@id"];
          var graph0 = obj["@graph"][0];
          var name = graph0["preferredName"];
          var types = "";
          if(tmp.indexOf(id) < 0){//Avoid duplicated tags
            tmp.push(id);
            for(type in graph0["@type"]){
              types = type.substring(type.lastIndexOf("#") + 1, type.length);
            }
            //Creates the checkboxes
            $("#subjectTags").append("<p id='pSuggestedSubjectTag" + tmp.length +"'><input type='checkbox' id='" + id.replace("/about","") +
                                                                                                        "' value='" + name.replace(/</g,'[').replace(/>/g,']') +
                                                                                                        "' class='chSubjectSuggestion' >" + decodeURI(name.replace(/</g,"[").replace(/>/g,"]")) +
                                                                                                        " - <a href='" + id + "' target='_blank'><img src='img/dnb.ico'></a> <a href='javascript: void(0)' onclick='removeElement(&quot;pSuggestedSubjectTag" + tmp.length + "&quot;)'><img src='img/delete.png' style='width: 2%; height: auto;'></a></p>");
          }
        }

      } else {

        $("#subjectTags").html("<p>No matches found for <b>'"+$("#paperMapSubjects").val()+"'</b>.</p>");

      }

    }
  });

}

/**
DBpedia Events Query
**/
function listDBpediaSuggestions(){

  if(!isNumber($('#tolerance').val())){
    $('#tolerance').val("0");
  }


  var searchYear = parseInt($('#paperMapTime').val()) + parseInt($('#tolerance').val());

  if(trans != null){

      var xyProjArrayBnd = getImageBoundariesInMapCoords(trans, imgModelScaled);
      var minBBOX = getBBOX(xyProjArrayBnd);

      var xMin = minBBOX[0];
      var yMin = minBBOX[1];
      var xMax = minBBOX[2];
      var yMax = minBBOX[3];

      var sparqlQuery = $.sparql()
      .prefix("geoWgs84","http://www.w3.org/2003/01/geo/wgs84_pos#")
      .prefix("xsd","http://www.w3.org/2001/XMLSchema#")
      .prefix("rdfs","http://www.w3.org/2000/01/rdf-schema#")
      .prefix("dbp-ont","http://dbpedia.org/ontology/")
      .prefix("foaf","http://xmlns.com/foaf/0.1/")
          .select(["?subject", "?label", "?wikiPage", "?abst"])
                .where("?subject","rdfs:label","?label")
                .where("?subject","dbp-ont:abstract","?abst")
                .where("?subject","geoWgs84:lat","?lat")
                .where("?subject","geoWgs84:long","?long")
                .where("?subject","dbp-ont:foundingYear","?start")
                .where("?subject","dbp-ont:dissolutionYear","?end")
                .optional().where("?subject","foaf:isPrimaryTopicOf","?wikiPage").end();


                sparqlQuery.filter("xsd:double(?lat) >= "+yMin+
                                  " && xsd:double(?lat) <= "+yMax+
                                  " && xsd:double(?long) >= "+xMin+
                                  " && xsd:double(?long) <= "+xMax+
                                  " && year(?start) <= "+searchYear+" && year(?end) >= "+searchYear+" ");

      if($('#languagesSuggestions').find('option:selected').val()!='all'){

        sparqlQuery.filter("LANGMATCHES(LANG(?label), '"+$('#languagesSuggestions').find('option:selected').val()+"') && LANGMATCHES(LANG(?abst), '"+$('#languagesSuggestions').find('option:selected').val()+"')");

      }

      console.log("SPARQL Encoded (BBOX) -> "+ sparqlQuery.serialiseQuery());
      console.log("Sending SPARQL...");


      sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), "http://dbpedia.org/sparql", dbpediaSuggestionsCallback, false);

      console.log("SPARQL executed");

    }
}

function dbpediaSuggestionsCallback(str) {

	console.log("#DEBUG query.js -> DBpedia places query executed.");


	var jsonObj = eval('(' + str + ')');
	console.log(jsonObj);



  if(jsonObj.results.bindings.length>0){

    $("#stSuggestions").html("");

    for(var i = 0; i<  jsonObj.results.bindings.length; i++) {


      if (typeof jsonObj.results.bindings[i].subject !== 'undefined') {
        var abst = jsonObj.results.bindings[i].subject.value;
        var label = jsonObj.results.bindings[i].label.value;
        var subject = jsonObj.results.bindings[i].subject.value;
        var wikiPage ="";

        if (typeof jsonObj.results.bindings[i].wikiPage !== 'undefined') {

          wikiPage = jsonObj.results.bindings[i].wikiPage.value;

        }

        $("#stSuggestions").append("<p id='pStTag" + i +"'><input type='checkbox' id='" + subject +
                                                                               "' value='" + subject +
                                                                               "' title='" + abst +
                                                                               "' class='chMapLinkSuggestion' >" + label +
                                                      " - <a href='" + subject + "' target='_blank'><img src='img/rdf.png' style='width: 2%; height: auto;'></a> "+
                                                      "<a href='javascript: void(0)' onclick='removeElement(&quot;pStTag" + i + "&quot;)'><img src='img/delete.png' style='width: 2%; height: auto;'></a>"+
                                                      "<a target='_blank' href='"+wikiPage+"'><img src='img/wikipedia.png' style='width: 2.5%; height: auto;'></a></p>");

      }

      }



  } else {

    $("#stSuggestions").html("<br>No matches found for the given map area and year.</span>");

  }
}


//Legacy code

/**
* Returns the limits of the image in map coordinates
* @param trans - A transformation object.
* @param {ScaledImage} imgModelScaled - Scaled image model.
* @returns An array of arrays [x,y]
*/
function getImageBoundariesInMapCoords(trans, imgModelScaled){
  var imgBnd = new Array();
  //Gets image coords
  imgBnd.push(imgModelScaled.getImageModel().getCartesianLowerLeft_Image1Q());
  imgBnd.push(imgModelScaled.getImageModel().getCartesianUpperLeft_Image1Q());
  imgBnd.push(imgModelScaled.getImageModel().getCartesianUpperRight_Image1Q());
  imgBnd.push(imgModelScaled.getImageModel().getCartesianLowerRight_Image1Q());
  //Projects coords
  var xyProjArrayBnd = trans.transform(imgBnd);
  return xyProjArrayBnd;
}

/**
* Gets the bounding box coordinates from a set of coordinates
* @param xyArray - Array of points [x,y]
* @returns An 1-dimension array [xMin, yMin, xMax, yMax]
*/
function getBBOX(xyArray){
	var xMin = Infinity;
	var yMin = Infinity;
	var xMax = -Infinity;
	var yMax = -Infinity;

	for(var i = 0; i < xyArray.length; i++){
		var xy = xyArray[i];
		var xMin = (xMin > xy[0]) ? xy[0] : xMin;
		var yMin = (yMin > xy[1]) ? xy[1] : yMin;
		var xMax = (xMax < xy[0]) ? xy[0] : xMax;
		var yMax = (yMax < xy[1]) ? xy[1] : yMax;
	}
	var res = new Array(xMin, yMin, xMax, yMax);
	return res;
}

/**
* Tests if the given URL points to an image
* @param testUrl - Image URL to be tested
* @returns TRUE if the file extension match an image format FALSE otherwise
*/
function isUrlOfImage(testUrl){
	//TODO: How to check if it really is an image e.g http://sammlungen.ulb.uni-muenster.de/hd/content/pageview/2578874
	res = false;
	if(isTextValid(testUrl)){
		/*if(isUrlValid(testUrl)){
			Check for common image file extension
			return /^.*\.(jpg|JPG|jpeg|JPEG|gif|GIF|bmp|BMP)$/.test(testUrl);
			res = true;
		}*/
		res = true;
		if(testUrl.indexOf("?") > 0 ){
			alert("The given URL contains parameters. Please remove the question mark and every character to the right of it.");
			res = false;
		}
	}
	return res;
}

/**
* Tests if the given string is valid
* @param txt - Text to be tested
* @returns TRUE if the text is not null and it has more than 0 characters, FALSE otherwise
*/
function isTextValid(txt){
	var res = false;
	if(txt != null){
		if(txt.length > 0){
			//TODO: check if txt is made of only white spaces
			res = true;
		}
	}
	return res;
}

/**
* Test if the given parameter is a number
* @param n - parameter
* @returns TRUE is the parameter is a number, FALSE otherwise
*/
function isNumber(n) {
	//Coded adapted from http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
	return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
* Takes a string of a RDF and finds the classes
* @param rdfTxt - A string representing RDF
* @returns An array of javascript objects
*/
function getRdfClasses(rdfTxt){
	var rdfClasses = rdfTxt.getElementsByTagName("owl:Class");
	var classArray = new Array();
	for(var i = 0 ; i < rdfClasses.length; i++){
		var uri = rdfClasses[i].getAttribute("rdf:about");

		var tmp = new Object();
		tmp.type = "Class";
		tmp.uri = uri;
		tmp.name = getLastStringAfterHash(uri);

		var childNodes = rdfClasses[i].childNodes;
		var tmpParents = new Array();
		for(var j = 0 ; j < childNodes.length; j++){
			if(childNodes[j].nodeName == "rdfs:subClassOf"){
				//alert(tmp.name + " - " + childNodes[j].getAttribute("rdf:resource"));
				tmpParents.push(childNodes[j].getAttribute("rdf:resource"));
			}
		}
		tmp.parents = tmpParents;
		tmp.children = new Array();
		classArray.push(tmp);
	}
	getChildrenClasses(classArray);
	return classArray;
}

function getLastStringAfterHash(urlTxt){
	var res = "";
	if(urlTxt != null){
		var tmpArray = urlTxt.split("#");
		if(tmpArray.length > 1){
			res = tmpArray[tmpArray.length - 1];// last element
		}
	}
	return res;
}

/**
* Takes a set of RdfClasses (javascript objects) and fills the array of each one with its children
* @param rdfClasses - An array of RdfClasses
*/
function getChildrenClasses(rdfClasses){
	for(var i = 0; i < rdfClasses.length; i++){
		var fatherUris = rdfClasses[i].parents;
		for(var k = 0; k < fatherUris.length; k++){
			var found = false;
			for(var j = 0; j < rdfClasses.length; j++){
				if(i == j) continue;
				if(rdfClasses[j].uri == fatherUris[k]){
					rdfClasses[j].children.push(rdfClasses[i].uri);
					found = true;
					break;
				}
			}
			if(found) break;
		}
	}
}

/**
* Add 0s in the left of a number
* @param number - Number to which 0s are being added
* @param size - Final lenght of the returned string
* @returns A string with some 0s to the left of the number
*/
function padNumber(number, size) {
    var res = "0000000000" + number;
    return res.substr(res.length - size);
}

/**
* Swaps the columns in a 2-dimensional array
* @param xyArray - Array made of [x,y] arrays where x and y are numbers
* @returns An array
*/
function xySwap(xyArray){
	var res = new Array();
	for(var i = 0; i < xyArray.length; i++){
		var xy = xyArray[i];
		var x = xy[0];
		var y = xy[1];
		var yx = new Array();
		yx.push(y);
		yx.push(x);
		res.push(yx);
	}
	return res;
}

/**
* Gets the bounding box coordinates from a set of coordinates
* @param xyArray - Array of points [x,y]
* @param proj - Projection object
* @returns An array of points [x,y]
*/
function xyProject(xyArray, proj){
	var res = new Array();
	for(var i = 0; i < xyArray.length; i++){
		var xy = xyArray[i];
		var ll = new L.LatLng(xy[1], xy[0]);
		var p = proj.project(ll);//Leaflet doesn't make transformations!!! http://leafletjs.com/reference.html#icrs
		var tmp = new Array(p.x, p.y);
		res.push(tmp);
	}
	return res;
}

/**
* Converts latlong objects to a 2-dimension array
* @param latlonArray - Array of latlong objects
* @returns An array of points [x,y]
*/
function latlon2xyArray(latlonArray){
	var res = new Array();
	for(var i = 0; i < latlonArray.length; i++){
		var ll = latlonArray[i];
		var tmpCoords = new Array(ll.lng, ll.lat);
		res.push(tmpCoords);
	}
	return res;
}

/*
* Encodes an xyArray [x,y] as Well Known Text. NOTE 1: An xyArray [x,y] can only represent a single polygon. NOTE 2: Some srs require you to switch xy to yx. This function does not check for that
* @param xyArray - An array of points [x,y]
* @param srsUrl - URL of a Spatial Reference System
* @returns A polygon encoded as WKT
*/

function xyArray2wktPolygon(xyArray, srsUrl){
	var res;
	var first;
	var last;
	var closed = true;
	for(var i = 0; i < xyArray.length; i++){
		var xy = xyArray[i];
		if(i == 0){
			res = xy[0] + " " + xy[1];
			first = xy;
		}else{
			res = res + "," + xy[0] + " " + xy[1];
		}
		last = xy;
	}
	if(first[0] != last[0]){
		closed = false;
	}
	if(first[1] != last[1]){
		closed = false;
	}
	if(closed == false){
		res = res + "," + first[0] + " " + first[1];
	}
	res = "POLYGON((" + res + "))";
	if(srsUrl != null && srsUrl != ""){
		res = "<" + srsUrl + ">" + res;
	}
	return res;
}

/**
* Tests if the given URL is valid
* @param url - URL to be tested
* @returns TRUE if the URL is valid, FALSE otherwise
*/
function isUrlValid(url){
	//TODO: How to validate a URL?????
	var res = true;
	/*if(isTextValid(url)){
		//TODO: There are some URLs which doesn't start with WWW
		var urlregex = new RegExp("^(http:\/\/www.|https:\/\/www.|ftp:\/\/www.|www.){1}([0-9A-Za-z]+\.)");
		if (urlregex.test(url)) {
			res = true;
		}
	}*/
    return res;
}

/**
* Tests if the given URI is valid
* @param uri - URI to be tested
* @returns TRUE if the URL is valid, FALSE otherwise
*/

function isUriValid(uri){
	//TODO
	var res = false;
	if(isTextValid(uri)){
		//var urlregex = new RegExp("^(http:\/\/www.|https:\/\/www.|ftp:\/\/www.|www.){1}([0-9A-Za-z]+\.)");
		//if (urlregex.test(uri)) {
		//TODO: Find a regular expression for URI validation
		res = true;
		//}
	}
    return res;
}

/**
* Counts the number of error and warning messages thrown by the validation function
*/
function countErrorMessages(messageArray){
	var ecount = 0;
	var wcount = 0;
	for(m in messageArray){
		if(m[0] == "ERROR"){
			ecount++
		}else if(m[0] == "WARNING"){
			wcount++
		}
	}
	return [ecount, wcount];
}

//Taken from http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
function replaceAll(find, replace, str) {
	return str.replace(new RegExp(find, 'g'), replace);
}

/**
* Calculates the length of a line made of point objects
* @param pointArray - An array of point objects
* @returns A number
*/
function pointArrayDistance(pointArray){
	var res = 0;
	for(var i = 1; i < pointArray.length; i++){
		var p0 = pointArray[i - 1];
		var p1 = pointArray[i];
		res = res + p0.distanceTo(p1);
	}
	return res;
}

/**
* Converts an array of points [x,y] to point an array of point objects
* @param xyArray - An array of points [x,y]
* @returns An array of point objects
*/
function xyArray2point(xyArray){
	var res = new Array();
	for(var i = 0; i < xyArray.length; i++){
		var xy = xyArray[i];
		var point = new L.Point(xy[0], xy[1]);
		res.push(point);
	}
	return res;
}

/**
* Calculates the length of a line made of latlong objects
* @param latlonArray - An array of latlon objects
* @returns The distance in meters
*/
function latLngArrayDistance(latlonArray){
	var res = 0;
	for(var i = 1; i < latlonArray.length; i++){
		var ll0 = latlonArray[i - 1];
		var ll1 = latlonArray[i];
		res = res + ll0.distanceTo(ll1);
	}
	return res;//Meters
}

/**
* Converts a 2-dimension array [x,y] to an array of latlong objects
* @param xyArray - An array of points [x,y]
* @returns A 1-dimension array of latlong objects
*/
function xyArray2latlon(xyArray){
	var res = new Array();
	for(var i = 0; i < xyArray.length; i++){
		var xy = xyArray[i];
		var latlng = new L.LatLng(xy[1], xy[0]);
		res.push(latlng);
	}
	return res;
}

/**
* Round a number
* @param number - Number to be rounded
* @param places - Number of decimals to be rounded to
* @returns A rounded number
*/
function roundNumber(number, places) {
    var multiplier = Math.pow(10, places);
    return (Math.round(number * multiplier) / multiplier);
}

/**
* Switch the dimension of a 2 dimensional array
* @param anArray - Array to be transposed
* @returns An array
*/
function trasposeArray(anArray){
	var res = anArray.slice(0);//Clone array
	for (var i = 0; i < res.length; i++) {
	  for (var j = 0; j < i; j++) {
		var temp = res[i][j];
		res[i][j] = res[j][i];
		res[j][i] = temp;
	  }
	}
	return res;
}

/**
* Replaces characters for escaped versions
* @param text - An string
* @returns An escaped string
*/
function getStringEscaped(text){
	var res = text;
	res = res.replace(/'/g, "\'");
	res = res.replace(/"/g, '\"');
	res = res.replace(/\\/g, '\\');
	return res;
}

function removeElement(id){
	$('#' + id).remove();
}
