google.load("visualization", "1", {packages:["treemap"]});

var keys =
{
	plannedCost : "Planned Cost ($ M)",
	dollarVariance : "Cost Variance ($ M)",
	percentVariance : "Cost Variance (%)",
	agencyName : "Agency Name",
	investTitle : "Investment Title",
	description : "Project Description"
};
var width = 70,
barHeight = 20;

d3.csv("data.csv",function(error,data)
{
	var nested_data = d3.nest()
		.key(function(d) {return d[keys.agencyName];})
		.entries(data);
	departmentOverruns(nested_data);
	nested_data.sort(function (a,b)
	{
		return b[keys.percentVariance] - a[keys.percentVariance];
	});
	console.log(nested_data);
	drawBarChart(nested_data,keys.percentVariance,"%");
	//drawTreeMap(nested_data[0].values,keys.dollarVariance,"mil $",keys.percentVariance);

});

function drawTreeMap(data,key,unit,colorKey)
{
	// google.setOnLoadCallback(function() 
	// {
		var treeArray = [];
		var agency;
		if(typeof data[0] != undefined)
		{
			agency = data[0][keys.agencyName];
		}
		var headers = ["Investment Title","Parent","Cost OverRun"+unit,colorKey];
		var root = [{v:"Root",f:agency},null,0,0];
		treeArray[treeArray.length] = headers;
		treeArray[treeArray.length] = root;
		
		$.each(data,function (i,value)
		{
			var title = {v:i,f:value[keys.investTitle]};
			var parent = "Root";
			var overRun = parseFloat(value[key]);
			var color = parseFloat(value[colorKey]);
			if(overRun<0||color<0)
			{
				color = 0;
				overRun = 0;
			}
			var row = [title,parent,overRun,color];

			treeArray[treeArray.length] = row;
		});
		
		tree = new google.visualization.TreeMap(document.getElementById('tmap'));
		var gvisData = google.visualization.arrayToDataTable(treeArray);
		tree.draw(gvisData, 
		{
			headerHeight: 15,
			fontColor: 'black',
			generateTooltip: makeToolTips,
			minColor: '#0a0',
          	midColor: '#aaa',
          	maxColor: '#a00',
          	showScale:true
		});
		function makeToolTips (row,size,color)
		{

			var point = getFullValue(row);
			var title, desc, plannedCost, overDollar, overPctg;
			if(typeof point != 'undefined')
			{
				title = point[keys.investTitle];
				desc = point[keys.description];
				overDollar = gvisData.getValue(row, 2);
				overPctg = gvisData.getValue(row, 3);
			}

			//html = "<div class='tooltip'>"+
			html = 	'<div style="background:#fd9; padding:10px; border-style:solid; border-width:1px">' +
					'<span style="font-family:Courier"><b>' + title +
   					'</b></span><br>' +
   					'<span>' +desc+'</span><br />'+
   					'<span><b><em>Overbudget by '+overPctg+'% costing $'+overDollar+' million</em></b></span>'+
   					'</div>';
			//"</div>";
			return html;
		}
		function getFullValue (googleRow)
		{
			return data[googleRow - 2];
		}
	//});
}

function drawBarChart(data,key,unit)
{
	//print to debug outliers in data 
	// $.each(data[3].values, function (i,d) {
	// 	console.log(d[key]+" "+i);
	// });

	var max = d3.max(data, function(d) {return d[key]});
	var min = d3.min(data, function(d) {return d[key]});

	console.log(max);
	var x = d3.scale.linear()
	.domain([0,max ])
	.range([0, width]);
	var colorScale = d3.scale.linear().
	domain([0,max])
	.range([0,255]);
	var chart = d3.select(".bchart");
	var bar = chart.selectAll("div")
		.data(data)
		.enter()
		.append("div")
		.classed("barCont",true)
		.on("click", function(d,i)
		{
			drawTreeMap(d.values,keys.dollarVariance,"mil $",keys.percentVariance);
		});

	bar.append("div")
		.text(function(d)
		{
			return d.key;
		})
		.classed("barName",true);

	bar.append("div")
		.style("width", function(d) { return x(d[key])  + "%"; })
		.classed("bar",true)
		.append("div")
		.classed("nlabel",true)
		.text(function(d) 
		{
			return  Math.round(d[key])+" "+unit; 
		});
}

//calculates the size of all budget overruns for each agency in % and millions of dollars and adds into the passed array
function departmentOverruns(nested_data)
{
	$.each(nested_data,function(i,agencyNode)
	{
		var dollarsOver = 0;
		var plannedDollars = 0;
		$.each(agencyNode.values, function(i,leaf)
		{
			var variance = parseFloat(leaf[keys.dollarVariance]);
			if (!isNaN(variance)&&variance>0) 
			{
				dollarsOver = dollarsOver + variance; 
			};

			var cost = parseFloat(leaf[keys.plannedCost]);
			if (!isNaN(cost)&&cost>0) 
			{
				plannedDollars = plannedDollars + cost; 
			};
		});
		var percentageOver = (dollarsOver / plannedDollars) *100;
		agencyNode[keys.dollarVariance] = dollarsOver;
		agencyNode[keys.plannedCost] = plannedDollars;
		agencyNode[keys.percentVariance] = percentageOver;
	});
}