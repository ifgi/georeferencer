var pageSize = 100;
var currentOffset = 0;
var searchSize = 0;

var finished = false;

function execute(offset){

  showSpin();
  finished = false;

  $("#paging").html("Please wait...");
  $("#list").html("");


  $(function(){

      getResultSetSize().done(function(){

          if(searchSize>0){

            executeQuery(offset);

          } else {

            $("#paging").html("No map found for the given search criteria.");
            hideSpin();
        }

      });

  });


}


function listGraphs() {



  if($('#cmbEndpoint').val()!=""){

    showSpin();
    var sparqlQuery = $.sparql().select(["?graph"]).graph("?graph").end();
    console.log("SPARQL Encoded -> "+ sparqlQuery.serialiseQuery());

  } else {

      $('#cmbNamedGraph').find('option').remove().end();
      $("#cmbNamedGraph").append(new Option("[Select a SPARQL Endpoint]", ""));
  }

  sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), $("#cmbEndpoint").val(), callBackGraphs, false);


}

function callBackGraphs(str) {

	console.log("#DEBUG virutallibrary.js -> listing named graphs executed.");

  $('#cmbNamedGraph').find('option').remove().end();

  var jsonObj = eval('(' + str + ')');

  for(var i = 0; i<  jsonObj.results.bindings.length; i++) {

      $("#cmbNamedGraph").append(new Option(jsonObj.results.bindings[i].graph.value, jsonObj.results.bindings[i].graph.value));

  }

  hideSpin();
}


function getResultSetSize() {

    showSpin();
    var dfd = $.Deferred();

    setTimeout(function working() {

      if ( finished == false ) {
        dfd.notify( "working... " );
        setTimeout( working, 100 );
      } else {
        dfd.resolve();
      }

    }, 1 );

/*
  	var sparqlQuery = $.sparql()
  			  .prefix("maps","http://www.geographicknowledge.de/vocab/maps#")
  			  .prefix("geo","http://www.opengis.net/ont/geosparql/1.0#")
  			  .prefix("xsd","http://www.w3.org/2001/XMLSchema#")
  			  .prefix("dct","http://purl.org/dc/terms/")
  			  .prefix("geof","http://www.opengis.net/def/function/geosparql/")
  			  .prefix("sf","http://www.opengis.net/ont/sf#")
          .prefix("rdfs","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
  			  	.select(["(COUNT(?map) as ?QT_MAPS)"])
  			  	.graph("<"+$("#cmbNamedGraph").val()+">")
  				  	.where("?map","a","maps:Map")
  				  	.where("?map","maps:digitalImageVersion","?picture")
  				  	.where("?map","maps:title","?title")
  				  	.where("?map","maps:presentation","?presentation")
  				  	.where("?map","maps:hasScale","?scale").end();

    sparqlQuery.filter("REGEX(STR(?title), '"+document.getElementById("searchField").value+"', 'i') || REGEX(STR(?description), '"+document.getElementById("searchField").value+"', 'i')");

    console.log("SPARQL Encoded -> "+ sparqlQuery.serialiseQuery());
    console.log("Sending SPARQL...");

*/

var sparqlQuery = $.sparql()
      .prefix("maps","http://www.geographicknowledge.de/vocab/maps#")
      .prefix("geo","http://www.opengis.net/ont/geosparql/1.0#")
      .prefix("xsd","http://www.w3.org/2001/XMLSchema#")
      .prefix("dct","http://purl.org/dc/terms/")
      .prefix("geof","http://www.opengis.net/def/function/geosparql/")
      .prefix("sf","http://www.opengis.net/ont/sf#")
      .prefix("rdfs","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
      .select(["(COUNT(?map) as ?QT_MAPS)"])
        .graph("<"+$("#cmbNamedGraph").val()+">")
          .where("?map","a","maps:Map")
          .where("?map","maps:digitalImageVersion","?picture")
          .where("?map","maps:title","?title")
          .where("?map","maps:presentation","?presentation")
          .where("?map","maps:hasScale","?scale")
          .where("?map","maps:mapsTime","?time")
          .where("?time","xsd:gYear","?year")
          .where("?map","rdfs:ID","?vlid")
          .optional().where("?map","maps:mapsArea","?area").end()
          .optional().where("?map","dct:description","?description").end()

          .end();

          if($.trim($('#startDate').val()) != '' && $.trim($('#endDate').val()) != ''){

            sparqlQuery.filter("xsd:integer(?year) >= " + $('#startDate').val() + " && xsd:integer(?year) <= " + $('#endDate').val());

          }

          if($('#ngeo').is(':checked')){sparqlQuery.filter("!BOUND(?area)");}
          if($('#geo').is(':checked')){sparqlQuery.filter("BOUND(?area)");}

          sparqlQuery.filter("REGEX(STR(?title), '"+document.getElementById("searchField").value+"', 'i') || REGEX(STR(?description), '"+document.getElementById("searchField").value+"', 'i')");



    sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), $("#cmbEndpoint").val(), callBackResultsetSize, false);





    console.log("SPARQL executed");

    return dfd.promise();

}




function callBackResultsetSize(str) {

	console.log("#DEBUG query.js -> result set size query executed.");

	//** Convert result to JSON
	var jsonObj = eval('(' + str + ')');
	searchSize=jsonObj.results.bindings[0].QT_MAPS.value;
  finished = true;
  //$('#status').html('<br><span>Named Graph contains ' + searchSize + ' maps.</span>');


}


//** Main Query
function executeQuery(offset) {

  $("#list").html("");

  currentOffset = offset;


  if($("#cmbEndpoint").val()=='' || $("#cmbNamedGraph").val()==''){

    alert("Select a SPARQL Endpoint and a Named Graph for listing the available maps.");

  } else {


    if(currentOffset>0){showSpin();}

  	var sparqlQuery = $.sparql()
  			  .prefix("maps","http://www.geographicknowledge.de/vocab/maps#")
  			  .prefix("geo","http://www.opengis.net/ont/geosparql/1.0#")
  			  .prefix("xsd","http://www.w3.org/2001/XMLSchema#")
  			  .prefix("dct","http://purl.org/dc/terms/")
  			  .prefix("geof","http://www.opengis.net/def/function/geosparql/")
  			  .prefix("sf","http://www.opengis.net/ont/sf#")
          .prefix("rdfs","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
  			  .select(["?map", "?title", "?wkt", "?picture", "?year", "?description", "?presentation", "?area", "?vlid"])
  			  	.graph("<"+$("#cmbNamedGraph").val()+">")
  				  	.where("?map","a","maps:Map")
  				  	.where("?map","maps:digitalImageVersion","?picture")
  				  	.where("?map","maps:title","?title")
  				  	.where("?map","maps:presentation","?presentation")
  				  	.where("?map","maps:mapsTime","?time")
  				  	.where("?time","xsd:gYear","?year")
              .where("?map","rdfs:ID","?vlid")
              .optional().where("?map","maps:mapsArea","?area").end()
              .optional().where("?map","dct:description","?description").end()

              .end()
              .limit(pageSize)
      			  .offset(offset);

              if($.trim($('#startDate').val()) != '' && $.trim($('#endDate').val()) != ''){

                sparqlQuery.filter("xsd:integer(?year) >= " + $('#startDate').val() + " && xsd:integer(?year) <= " + $('#endDate').val());

              }

              if($('#ngeo').is(':checked')){sparqlQuery.filter("!BOUND(?area)");}
              if($('#geo').is(':checked')){sparqlQuery.filter("BOUND(?area)");}

              sparqlQuery.filter("REGEX(STR(?title), '"+document.getElementById("searchField").value+"', 'i') || REGEX(STR(?description), '"+document.getElementById("searchField").value+"', 'i')");


    console.log("SPARQL Encoded -> "+ sparqlQuery.serialiseQuery());
    console.log("Sending SPARQL...");


    sparqlQueryJson(encode_utf8(sparqlQuery.serialiseQuery()), $("#cmbEndpoint").val(), mainCallback, false);

    console.log("SPARQL executed");

  }
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

function mainCallback(str) {

	console.log("#DEBUG query.js -> main query executed.");

	//** Convert result to JSON
	var jsonObj = eval('(' + str + ')');

	console.log(jsonObj);

	$("#list").html("");
	$("#list").append('<table class="table-style-three" id="mapstable" border="1"><tr><th>VL ID</th><th>Map Title</th><th>Map Description</th><th>Year</th><th>Image</th><th></th><th></th></tr>');


  var counter = 0;
	for(var i = 0; i<  jsonObj.results.bindings.length; i++) {

    counter++;
		//** Creates list item.
		if (typeof jsonObj.results.bindings[i].map !== 'undefined') {

      var area ='';

      if (typeof jsonObj.results.bindings[i].area !== 'undefined') {

        area = "<img src='img/check.svg' width=30 height=30 title='Map already georeferenced.'>";

      } else {
        area = "<img src='img/uncheck.svg' width=20 height=20 title='No WKT Geometry found.'>";
      }

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

      $("#list table").append("<tr><td><a target='_blank' href="+presentation+">"+vlid+
                              "</a></td><td>"+title.trim()+
                              "</td><td>"+description.trim()+
                              "</td><td>"+year+
                              "</td><td><a target='_blank' href='"+picture+"'><img src='"+picture.replace("/0/","/128/")+"' width=70 height=70></a>"+
                              "</td><td style='text-align: center;'>"+area+

                              "</td><td><a target='_blank' href=visuallibrary-georeferencer.html?endpoint="+$("#cmbEndpoint").val()+
                                                           "&graph="+$("#cmbNamedGraph").val()+
                                                           "&id="+vlid+
                                                           "&image="+picture+"><img src='img/edit.png' width=20 height=20 title='Click to edit the map [" + title + "]'></a></td></tr>");


	}



}




    $("#paging").text("Maps: "+currentOffset +' - '+ (counter+currentOffset) + ' from: ' + searchSize +" ");

    if(currentOffset>0){

      $("#paging").append("<a onclick='executeQuery("+ (currentOffset-pageSize)+")' href='#'>< previous</a> ");

    }

    if(searchSize>pageSize && (currentOffset+pageSize < searchSize)){

        $("#paging").append("<a onclick='executeQuery("+ (currentOffset+pageSize)+")' href='#'>next ></a>");

    }

    if(currentOffset>0){hideSpin();}

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

	target = document.getElementById('list');
	spinner = new Spinner(opts).spin(target);

	target.appendChild(spinner.el);

}

function hideSpin(){

	spinner.stop();

}
