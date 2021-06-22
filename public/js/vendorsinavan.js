const DISCOUNT_TIME = 900; //15 mins in milliseconds
const WARNING_TIME = 600; //for warning highlighting at 10 mins

function OnLoadVendor(){
	//Pre-load a page of orders and periodic new order check
	LoadOrders(20,false);
	setInterval(function(){ if (orderLoadDelay) LoadOrders(5,true);}, 5000);
	//Ticking timers
	setInterval(function(){ UpdateTimers();}, 1000);
	
	//Init events for infinite scroll
	InitScrolling();
}

var orderHistoryComplete = false;
var orderLoadDelay = true;
var pastOrdersList = [];
var pastOrdersNewest = Date.now();
var pastOrdersOldest = Date.now();
/* Populate order list elements from template */
async function LoadOrders(count, prepend){
	//Abort past order check if we already have them all.
	if(!prepend && orderHistoryComplete) return;
	//Update flag so we don't have multiple checks at once if the server's slow
	orderLoadDelay = false;
	
	var template_past = document.querySelector("#orderTemplate");
	if( template_past==null ) return;
	var template_open = document.querySelector("#orderTemplate-open");
	var anchor_past = document.querySelector("#past-container");
	var anchor_open = document.querySelector("#orders-container");
	
	//Filter out end/last ID to avoid redundancy if we're only grabbing one
	//(necessary because orders can occur on the same unix second)
	rejectID = -1;
	if(pastOrdersList.length>0) rejectID= prepend?pastOrdersList[0]:pastOrdersList[pastOrdersList.length-1];

	const orders = await retrieveOrders(count, true, prepend, prepend?pastOrdersNewest:pastOrdersOldest, rejectID);
	
	if(anchor_open!=null) PopulateOrder(template_open, anchor_open, orders, prepend, true, null);
	PopulateOrder(template_past, anchor_past, orders, prepend, false, pastOrdersList);
	
	// Give up on loading order history once we reach the end
	if(!prepend && orders.length==0) orderHistoryComplete = true;
	
	//Clear update flag
	orderLoadDelay = true;
}
function PopulateOrder(template, anchor, orders, prepend, open, ordersList){
	for (var i=0; i < orders.length; ++i){
		var o = orders[i];
		if(!open){
			if(ordersList.includes(o.orderNumber)) continue;
			if(prepend) ordersList.unshift(o.orderNumber);
			else 		ordersList.push(o.orderNumber);
			
			if(o.orderTime < pastOrdersOldest) pastOrdersOldest = o.orderTime;
			if(o.orderTime > pastOrdersNewest) pastOrdersNewest = o.orderTime;
		}
		
		// Abort if we're updating the other list
		if( open && (o.cancelled||o.pickedUp) ) continue;
		else if( !open && !o.cancelled && !o.pickedUp ) continue;
		


		var clone = template.content.cloneNode(true);
		
		if (o.cancelled) {
			(clone.querySelector(".vOrder")).classList.add("vO-cancelled");
			(clone.querySelector(".vO-status")).classList.add("vO-cancelled");
		}
		else if (o.discounted) (clone.querySelector(".vOrder")).classList.add("vO-discounted");
		(clone.querySelector(".vOrder")).id = "oid-"+o._id;
		(clone.querySelector(".vO-number")).innerHTML = "#"+ o.orderNumber;
		odate = new Date(o.orderTime);
		if(!open)(clone.querySelector(".vO-date")).innerHTML = odate.toLocaleDateString("en", {dateStyle: "short"});
		(clone.querySelector(".vO-time")).innerHTML = odate.toLocaleTimeString("en", {timeStyle: "short"});
		(clone.querySelector(".vO-name")).innerHTML = '"'+o.customer.givenName+'"';
		(clone.querySelector(".vO-itemcount")).innerHTML = o.customer.cart.length + (open?'<span class="vO-smaller"> items</span>':" items");
		var cost = (o.customer.cartCost).toString().split(".");
		(clone.querySelector(".vO-total")).innerHTML = "<sup>$</sup>"+cost[0]+"<sup>."+(cost[1]==null?"00":cost[1])+"</sup>";
		if(open) (clone.querySelector(".vO-status")).innerHTML = o.fulfilled?"READY":"&nbsp;";
		else (clone.querySelector(".vO-status")).innerHTML = o.cancelled?"Cancelled.":(o.pickedUp?"PICKED UP":"&nbsp;");
		(clone.querySelector(".vO-discount")).innerHTML = o.discounted?"Discounted":"&nbsp;";
		if(open) {
			formatTimer(clone.querySelector(".vOpen-timer"), o.orderTime);
			clone.querySelector(".vOpen-timer").id = "vOtimer-" + o.orderTime;
			
			if(!o.fulfilled) (clone.querySelector(".vButtonPickup")).classList.add("vButtonUnready");
			else (clone.querySelector(".vButtonReady")).classList.add("vButtonUnready");
			
			//alert(clone.querySelector(".vButtonReady").attributes[1].name);
			clone.querySelector(".vButtonReady").attributes[1].value ="fulfilled('"+o._id+"')";
			clone.querySelector(".vButtonPickup").attributes[1].value = "collectOrder('"+o._id+"')";
		}
		else (clone.querySelector(".vO-timer")).innerHTML = "&nbsp;"; //resolution/pickup time should go here once it's in the db
		if(!open){
			var stars="";
			for (var s=0; s<o.rating; ++s){ stars = stars+"★";}
			(clone.querySelector(".vO-rating")).innerHTML = stars==""?"&nbsp;":stars + "☆☆☆☆☆".substring(0,5-o.rating);
			if (o.comment==null){
				(clone.querySelector(".vO-commented")).classList.add("vO-uncommented");
				(clone.querySelector(".vO-feedback")).classList.add("vO-uncommented");
			}
			else (clone.querySelector(".vO-feedbox")).innerHTML = o.comment;
			
			clone.querySelector(".vButtonUnmark").attributes[1].value = "unmarkOrder('"+o._id+"')";
		}
		var itemtext = "";
		for (var c=0; c < o.customer.cart.length; ++c){
			if( o.customer.cart[c].quantity>0){
				itemtext+='<div>&nbsp;&nbsp;'+o.customer.cart[c].quantity +"&nbsp;•&nbsp;"+ o.customer.cart[c].food.name +"</div>";
			}
		}
		(clone.querySelector(".vO-orderItems")).innerHTML = itemtext;
		
		if (open){
			if(!prepend) anchor.insertBefore(clone,anchor.firstChild);
			else anchor.appendChild(clone);
		}
		else {
			if(prepend) anchor.insertBefore(clone,anchor.firstChild);
			else anchor.appendChild(clone);
		}
	}
}
/* Timer field formatting */
const pad = (n) => String(n).padStart(2, '0');
function formatTimer(element,ordertime){
	var oseconds = Math.floor((Date.now()-ordertime)/1000);
	var ominutes = Math.floor(oseconds/60);
	var ohours = Math.floor(ominutes/60);
	element.innerHTML = (ohours>0?ohours%60 +":":"")+pad(ominutes%60)+":"+pad(oseconds%60);
	if(ohours>0) element.classList.add("vOrder-timerHours");
	if(oseconds>=DISCOUNT_TIME) element.classList.add("vOrder-timerDiscount");
	else if(oseconds>=WARNING_TIME) element.classList.add("vOrder-timerWarning");
	
	return oseconds;
}

/* Update and reformat all timers */
function UpdateTimers(){
	(document.querySelectorAll(".vOpen-timer")).forEach(function(t) {
		if(t.parentNode.parentNode.querySelector(".vO-status").innerHTML=="READY") return;
		var sec = formatTimer(t,t.id.substring(8, t.id.length));
		if (sec==DISCOUNT_TIME){
			var d = t.parentNode.parentNode.parentNode;
			d.classList.add("vO-discounted");
			d.querySelector(".vO-discount").innerHTML = "Discounted";
		}
	});
}

/* Server call for lumps of orders */
async function retrieveOrders(count, closed, prepend, checktime, rejectID) {
	const options = {
		method: 'POST',
		headers : {
			'Content-Type': 'application/json'
		},
	};
	const query = await fetch("/vendor/api/"+count+"/"+closed+"/"+prepend+"/"+checktime+"/"+rejectID, options); 
	const r = await query.json();
	return r.orders;
}

/* Filter past orders by name */
function pastFilter(filterField){
	var nodes = (document.querySelector("#past-container")).querySelectorAll(".vOrder");
	for (var i=0; i<nodes.length; ++i){
		nodename = (nodes[i].querySelector(".vO-name").innerHTML).toLowerCase();
		if (nodename.substring(1, nodename.length-1).substring(0, filterField.value.length) == filterField.value.toLowerCase() ) nodes[i].classList.remove("pastFiltered");
		else nodes[i].classList.add("pastFiltered");
	}
}

/* Toggle order box details */
function ExpandOrder(element){
	var id = (element.id.slice(4));
	orderExpand = element.querySelector(".vOrderExpand");
	var toggleself= orderExpand.classList.contains("vOrderExpanded");
	//collapse others
	document.querySelectorAll(".vOrderExpand").forEach( function(orders){
		orders.classList.remove("vOrderExpanded");
	});
	//expand self
	if (toggleself) orderExpand.classList.remove("vOrderExpanded");
	else orderExpand.classList.add("vOrderExpanded");
}

/* Init order list scroll event to look for more if we're past 60% of content */
var scrollContainer;
function InitScrolling(){
	scrollContainer = document.getElementById("past-container");
	if (scrollContainer.addEventListener) scrollContainer.addEventListener("scroll", OrderScroller, false)
	else if (scrollContainer.attachEvent) scrollContainer.attachEvent("onscroll", OrderScroller);
}
function OrderScroller(){
	var scroll = (scrollContainer.scrollTop+(window.innerHeight*0.83))/scrollContainer.scrollHeight;
	if (orderLoadDelay && scroll > 0.6){
		orderLoadDelay = false;
		LoadOrders(10,false);
	} 
}

/* Past orders list visibility toggle event */
var isPastVisible = false;
function TogglePastOrders(){
	var pastMenu = document.querySelector("#past-menu");
	var pastHeader = document.querySelector("#past-header");
	var pastContainer = document.querySelector("#past-container");
	var vendorControls = document.querySelector("#vendor-controls");
	
	// If it's visible, let's hide it
	if( isPastVisible ){ 
		isPastVisible = false;
		
		// Remove toggle event from dark layer when we can't see it
		pastMenu.style.pointerEvents = "none";
		
		// Make the menu slide+fade out by attaching and removing classes to trigger CSS animations 
		vendorControls.style.display = "flex";
		pastHeader.style.display = "none";
		pastMenu.classList.add("slide-out");
		pastMenu.classList.remove("slide-in");
	}
	// If it's hidden, now appear
	else{ 
		isPastVisible = true;
		
		// Reattach toggle event so you can close the menu by clicking anywhere
		pastMenu.style.pointerEvents = "auto";
		
		// Slide+fade in with animating classes
		vendorControls.style.display = "none";
		pastHeader.style.display = "flex";
		pastContainer.style.display = "block";
		pastMenu.classList.add("slide-in");
		pastMenu.classList.remove("slide-out");
	}
}

function fulfilled(orderId)
{
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			window.location.reload(true);
		}
	};

	xhttp.open("POST", "/vendor/fulfilled/"+orderId, true);
	xhttp.send();
}

function unmarkOrder(orderId){
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			window.location.reload(true);
		}
	};

	xhttp.open("POST", "/vendor/unFulfilled/"+orderId, true);
	xhttp.send();
}

function collectOrder(orderId)
{
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			window.location.reload(true);
		}
	};
	xhttp.open("POST", "/vendor/collectOrder/"+orderId, true);
	xhttp.send();
}