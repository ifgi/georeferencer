
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





function listGNDInfo(mapID) {

  	var sparqlQuery = $.sparql()
  			  .prefix("maps","http://www.geographicknowledge.de/vocab/maps#")
  			  .prefix("dnb","http://d-nb.info/standards/elementset/gnd#")
          .prefix("rdfs","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
          .prefix("dct","http://purl.org/dc/terms/")
  			  .select(["?map", "?gndPlace", "?gndPlaceName"])
  			  	.graph("<http://ulb.uni-muenster.de/context/karten/muenster/historical>")
  				  	.where("?map","a","maps:Map")
              .where("?map","rdfs:ID","?vlid")
              .where("?map","dct:references","?gndPlace")
              .where("?map","dct:references","?gndPlace")
              .optional().where("?gndPlace","dnb:preferredNameForThePlaceOrGeographicName","?gndPlaceName").end().end();

              sparqlQuery.filter("?vlid='"+mapID+"'");


    console.log("SPARQL Encoded GND Info (Places) -> "+ sparqlQuery.serialiseQuery());
    console.log("Sending SPARQL...");


    sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), "http://linkeddata.uni-muenster.de:8081/parliament/sparql", gndInfoCallback, false);

    console.log("SPARQL executed");

}

function gndInfoCallback(str) {

	console.log("#DEBUG query.js -> GND Info (Places) query executed.");


	var jsonObj = eval('(' + str + ')');
	console.log(jsonObj);

  var gndInfoString ="";

	for(var i = 0; i<  jsonObj.results.bindings.length; i++) {

			if (typeof jsonObj.results.bindings[i].gndPlace !== 'undefined') {

        gndInfoString = gndInfoString +  jsonObj.results.bindings[i].gndPlace.value + ", ";

			}

  }


  $('#gndInfo').val(gndInfoString);
  $('#gndInfo').inputTags();
  $("#gndInfo").prop('disabled', true);


}

function listSameAs(mapID) {

  	var sparqlQuery = $.sparql()
  			  .prefix("maps","http://www.geographicknowledge.de/vocab/maps#")
  			  .prefix("owl","http://www.w3.org/2002/07/owl#")
  			  .prefix("dnb","http://d-nb.info/standards/elementset/gnd#")
          .prefix("rdfs","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
  			  .select(["?map", "?sameAs", "?authorName"])
  			  	.graph("<http://ulb.uni-muenster.de/context/karten/muenster/historical>")
  				  	.where("?map","a","maps:Map")
              .where("?map","rdfs:ID","?vlid")
              .where("?map","owl:sameAs","?sameAs").end();

              sparqlQuery.filter("?vlid='"+mapID+"'");


    console.log("SPARQL Encoded (sameAs) -> "+ sparqlQuery.serialiseQuery());
    console.log("Sending SPARQL...");


    sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), "http://linkeddata.uni-muenster.de:8081/parliament/sparql", sameAsCallback, false);

    console.log("SPARQL executed");

}

function sameAsCallback(str) {

	console.log("#DEBUG query.js -> sameAs query executed.");


	var jsonObj = eval('(' + str + ')');
	console.log(jsonObj);

  var sameAsString ="";

	for(var i = 0; i<  jsonObj.results.bindings.length; i++) {

			if (typeof jsonObj.results.bindings[i].sameAs !== 'undefined') {

        sameAsString = sameAsString +  jsonObj.results.bindings[i].sameAs.value + ", ";

			}

  }


  $('#sameAsTags').val(sameAsString);
  $('#sameAsTags').inputTags();
  $("#sameAsTags").prop('disabled', true);


}

function listAuthors(mapID) {

  	var sparqlQuery = $.sparql()
  			  .prefix("maps","http://www.geographicknowledge.de/vocab/maps#")
  			  .prefix("dct","http://purl.org/dc/terms/")
  			  .prefix("dnb","http://d-nb.info/standards/elementset/gnd#")
          .prefix("rdfs","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
  			  .select(["?map", "?author", "?authorName"])
  			  	.graph("<http://ulb.uni-muenster.de/context/karten/muenster/historical>")
  				  	.where("?map","a","maps:Map")
              .where("?map","rdfs:ID","?vlid")
              .where("?map","dct:creator","?author")
              .optional().where("?author","dnb:variantNameForThePerson","?authorName").end().end();

              sparqlQuery.filter("?vlid='"+mapID+"'");


    console.log("SPARQL Encoded -> "+ sparqlQuery.serialiseQuery());
    console.log("Sending SPARQL...");


    sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), "http://linkeddata.uni-muenster.de:8081/parliament/sparql", authorsCallback, false);

    console.log("SPARQL executed");

}

function authorsCallback(str) {

	console.log("#DEBUG query.js -> authors query executed.");


	var jsonObj = eval('(' + str + ')');
	console.log(jsonObj);

  var authorsString ="";

	for(var i = 0; i<  jsonObj.results.bindings.length; i++) {

		if (typeof jsonObj.results.bindings[i].map !== 'undefined') {

      var authorURI ='';
			var authorName = '';

			if (typeof jsonObj.results.bindings[i].author !== 'undefined') {
				authorURI = jsonObj.results.bindings[i].author.value;
			}

			if (typeof jsonObj.results.bindings[i].authorName !== 'undefined') {
				authorName = jsonObj.results.bindings[i].authorName.value;

			}

      authorsString = authorsString + authorURI + ",";


    }
  }

  $('#paperMapCreator').val(authorsString);
  $('#paperMapCreator').inputTags();

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
  			  	.graph("<http://ulb.uni-muenster.de/context/karten/muenster/historical>")
  				  	.where("?map","a","maps:Map")
  				  	.where("?map","maps:digitalImageVersion","?picture")
  				  	.where("?map","maps:title","?title")
  				  	.where("?map","maps:presentation","?presentation")
  				  	.where("?map","maps:hasScale","?scale")
  				  	.where("?map","maps:mapsTime","?time")
              .where("?map","maps:mapSize","?size")
  				  	.where("?time","xsd:gYear","?year")
              .where("?map","rdfs:ID","?vlid")
              .optional().where("?map","maps:mapsArea","?area").end()
              .optional().where("?map","dct:description","?description").end().end();

              sparqlQuery.filter("?vlid='"+mapID+"'");


    console.log("SPARQL Encoded -> "+ sparqlQuery.serialiseQuery());
    console.log("Sending SPARQL...");


    sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), "http://linkeddata.uni-muenster.de:8081/parliament/sparql", queryCallback, false);

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
			}

			if (typeof jsonObj.results.bindings[i].title !== 'undefined') {
				title = jsonObj.results.bindings[i].title.value;

			}

			if (typeof jsonObj.results.bindings[i].presentation !== 'undefined') {
				presentation = jsonObj.results.bindings[i].presentation.value;
			}

			if (typeof jsonObj.results.bindings[i].picture !== 'undefined') {
				picture = jsonObj.results.bindings[i].picture.value;
			}

			if (typeof jsonObj.results.bindings[i].map !== 'undefined') {
				mapVar = jsonObj.results.bindings[i].map.value;
			}

			if (typeof jsonObj.results.bindings[i].scale !== 'undefined') {
				scale = jsonObj.results.bindings[i].scale.value;
			}

			if (typeof jsonObj.results.bindings[i].year !== 'undefined') {
				year = jsonObj.results.bindings[i].year.value;
			}

			if (typeof jsonObj.results.bindings[i].size !== 'undefined') {
				size = jsonObj.results.bindings[i].size.value;
			}

      if (typeof jsonObj.results.bindings[i].vlid !== 'undefined') {
				vlid = jsonObj.results.bindings[i].vlid.value;
			}

      if (typeof jsonObj.results.bindings[i].wkt !== 'undefined') {

        wkt = "<img src='img/check.svg' width=30 height=30 title='Map already georeferenced.'>";

      } else {
        wkt = "<img src='img/uncheck.svg' width=20 height=20 title='No WKT Geometry found.'>";
      }


      $("#vlid").val(vlid);
      $("#paperMapTitle").val(title);
      $("#taMapDescription").val(description);

      $("#paperMapTime").val(year);
      $("#paperMapScale").val(scale);
      $("#paperMapSize").val(size);
      $("#url").val(presentation);
    }

    }
}







function closePopup(popup){

  //document.getElementById('placesPopup').style.display='none';document.getElementById('fade').style.display='none'
  $('#'+popup).css("display","none");
  $('#fade').css("display","none");

}

function openPopup(popup){

  $('#'+popup).css("display","block");
  $('#fade').css("display","block");


}

function addPlacesGND(){

  //$( "#container" ).html( $( "input:checked" ).val() + " is checked!" );
  //var selected = [];
  var placesString = "";
  var currenPlaces = $('#gndInfo').val();

  $('#subjectTags input:checked').each(function() {
      //selected.push($(this).attr('value'));
      //alert($(this).attr('id'));
      //$('#gndInfo').val($('#gndInfo').val() + $(this).attr('id') + ",");
      if(!currenPlaces.contains($(this).attr('id')) && !placesString.contains($(this).attr('id'))){

        placesString = placesString + $(this).attr('id') + ",";

      } else {

        alert("Place already inserted!\n\nGND ID: " + $(this).attr('id') + "\nPlace Name: " +  $(this).attr('value')+"\n");

      }
  });

  $('#gndInfoContainer').html('<input type="text" id="gndInfo">');
  $('#gndInfo').val(currenPlaces + placesString);
  $('#gndInfo').inputTags();
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

function showSpin(){

	target = document.getElementById('mapImage');
	spinner = new Spinner(opts).spin(target);

	target.appendChild(spinner.el);

}

function hideSpin(){

	spinner.stop();

}
