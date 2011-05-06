var app;
var store;
var cart;
//holds clientes in arrat
var clientes=[];

//holds clientes in map
var map_clientes=[];

//holds productos in array
var productos=[];

//holds productos in map
var map_productos=[];

//productos to be saved in pedido
var map_selected_productos=[];

//oportunidades
var oportunidades = new Array();

//placeholder for selected cliente
var currentClienteId='';
var username='';
var password='';
var token='';

$(document).ready(function(){
	app = $.sammy('body', function() {
	this.use(Sammy.JSON);
	this.use(Sammy.Storage);
	this.use(Sammy.Template, 'erb');
	this.debug = true;

	///////////////////////////////
	///////// ROUTES
	//////////////////////////////////

	this.get('#login/',function(){
		hideAllDivs();
		var context = this;
		$('#login img').hide();
		$('#login').show();
	});

	this.get('#loading/',function(){
		hideAllDivs();
		$('#loading').show();
	});

	this.get('#pedido_new/',function(){
		hideAllDivs();
		$('#txt_searchCliente').val('');
		$('#selectCliente').show();
	});

	this.get('#pedido_selectCliente/:id',function(){
		var context = this;
		hideAllDivs();
		$('#txt_searchCliente').val('');
		currentClienteId = this.params['id'];
		$('#clientesList').html(' ');

		$('#txt_searchProducto').val('');
		$('#selectedProductosList').html(' ');
		$('.contentFooter').hide();


		var cliente = map_clientes[currentClienteId];
		$('#doPedido .title').html(cliente.Name);
		$('#doPedido').show();
	});
 
	this.get('#pedido_save/',function(){
		var context = this;
		hideAllDivs();

		for(var index in map_selected_productos) {
			item = map_selected_productos[index];
			producto = map_productos[index];
			var cliente = map_clientes[currentClienteId];

			pid = index.split(',')[0];
			cid=currentClienteId.split(',')[0];

			oportunidad=new Object();
			oportunidad.cliente__c = cid;
			oportunidad.producto__c= pid;
			oportunidad.cantidad__c=item.Cantidad ;
			oportunidad.precio__c = item.Precio;
			oportunidad.descuento__c = item.Descuento;
			oportunidad.cliente = cliente.Name;
			oportunidad.observacion__c = item.Observacion;
			oportunidad.ispedido__c=false;
			oportunidad.isoportunidad__c=false;
			if(item.Pedido.indexOf('checked')>-1){
				oportunidad.ispedido__c="true";}
			if(item.Oportunidad.indexOf('checked')>-1){
				oportunidad.isoportunidad__c="true";}
			oportunidad.producto = producto.Name;
			oportunidad.fecha = new Date();
			oportunidad.type ='Oportunidad__c';
			oportunidades.push(oportunidad);
		}

		store.set('oportunidades', oportunidades);

		map_selected_productos=new Array();
		$('#productosList').html(' ');
		context.redirect('#pedido_show/');
	});

	this.get('#pedido_delete/:index',function(){
		var index = this.params['index'];
		oportunidades.splice(index,1);
		store.set('oportunidades', oportunidades);
		this.redirect('#pedido_show/');
	});

	this.get('#pedido_show/',function(){
		$('#ajaxLoader').hide();
		var context = this;
		hideAllDivs();
		$('#listPedido').show();
		$('#pedidosList').html('');
		$.each(oportunidades, function(i, item) {
				context.partial('/templates/oportunidad_a.html.erb', {item: item,index: i}, function(html) {
					$('#pedidosList').append(html);
				});
		});
	});

	this.get('#pedido_send/',function(){
		$('#ajaxLoader').show();
		var query = 'username=' + username + '&password=' + password + '&token='+token + '&oportunidades='+this.json(oportunidades);
		var context = this;
		$.ajax({
			url: "/saveOpportunities",
			type:"POST",
			data: query ,
			context: document.body,
			success: function(data){
				context.trigger('hangleSaveOportunidades',{all: data});
			},
			error: function(re,text,error) {
				context.trigger('handleSaveOportunidadesError',{request: re , text: text , error: error});
			}
		});
	});

	///////////////////////////////
	///////// EVENTS
	//////////////////////////////////

	////////////////////////
	////////// PRODUCT EVENTS

	this.bind('changeItem', function(e, data) {
		var context = this;
		id = data['id'];
		value = data['value'];
		type = data['type'];

		selectedItem = map_selected_productos[id];

		if(type=='cantidad'){
			if(selectedItem==null){
				refProducto = map_productos[id];
				map_selected_productos[id] = {Id:id,Cantidad: value, Name: refProducto.Name, Precio: refProducto.PrecioMinimo__c,Descuento: refProducto.DescuentoMinimo__c,Impuesto: refProducto.Impuesto__c,Pedido: 'checked="checked"',Oportunidad: '',Observacion: "" };
			}
			if(selectedItem!=null && value==0){
				var index = map_selected_productos.indexOf(id);
				map_selected_productos.splice(index,1);
			}
			else{
				map_selected_productos[id].Cantidad = value;
			}
		}

		else if(type=='descuento'){
				map_selected_productos[id].Descuento = value;
		}

		else if(type=='pedido'){
				if(value==true){
					value='checked="checked"';
				}
				else{
					value='';
				}
			
				map_selected_productos[id].Pedido = value;
			
				}

		else if(type=='oportunidad'){
				if(value==true){
					value='checked="checked"';
				}
				else{
					value='';
				}
				map_selected_productos[id].Oportunidad = value;
		}

		else if(type=='observacion'){
				map_selected_productos[id].Observacion = value;
		}

		$('.contentFooter').show();

	
		context.trigger('refreshTotal');
	});


	//Refreshes Producto Views, RERENDER
	this.bind('refreshShowProductos', function(e, data) {
		var context = this;
		$('#selectedProductosList').html(' ');
		tempArray=[];
		for(var index in map_selected_productos) {
			tempArray.push(map_selected_productos[index]);
		}

		$.each(tempArray, function(i, item) {
			context.partial('/templates/productoItemList_b.html.erb', {item: item}, function(html) {
				$('#selectedProductosList').append(html);
			});
		});

	 
	
	});

	//Calculates Total for Selected Items
	this.bind('refreshTotal', function(e, data) {
		var context = this;
		var total =0;
		$('.contentFooter').show();

		for(var index in map_selected_productos) {
			item = map_selected_productos[index];
			producto = map_productos[index];
			subtotal = item.Cantidad * item.Precio;
			descuento = subtotal * item.Descuento / 100;
			impuesto = (subtotal - descuento) * item.Impuesto / 100;
			total += subtotal -descuento + impuesto;
		}

		$('#totalPlaceHolder').html('Total: c/ ' + total);

		context.trigger('refreshShowProductos');

	});

	////////////////////////
	////////// LOGIN  EVENTS

	this.bind('requestLogin',function(){
		username = $('#txt_username').val();
		password = $('#txt_password').val();
		token = $('#txt_token').val();
		var query = 'username=' + username + '&password=' + password + '&token='+token;
		var context = this;
		$.ajax({
			url: "/login",
			type:"GET",
			data: query ,
			context: document.body,
			success: function(data){
				context.trigger('handleLogin');
			},
			error: function(re,text,error) {
				context.trigger('handleLoginError',{request: re , text: text , error: error});
			}
		});
	})

	this.bind('handleLogin',function(){
		var context = this;
		store.set('username',username);
		store.set('password',password);
		store.set('token',token);
		store.set('authKey','ok');
		context.redirect('#loading/');
		context.trigger('loadRemoteData');
	});

	this.bind('handleLoginError',function(e,data){
		var context = this;
		var re = data['request'];

		if(re.status==404){
			if(store.get('authKey')==null){
				alert('No encontramos una session anterior, para hacer Login debe estar conectado a Internet.');
				context.redirect('#login/');
			}
			else{
				alert('Trabajando Off-Line');
				context.trigger('loadLocalData');
			}
		}
		else{
			$('#txt_username').val(username);
			$('#txt_password').val('');
			$('#txt_token').val('');
			alert('Error haciendo login');
			context.redirect('#login/');
		}
	});

	////////////////////////
	////////// DATA LOADING EVENTS

	this.bind('loadRemoteData',function(){
		var context = this;
		$.ajax({
		url: "/getdata",
		type:"GET",
		context: document.body,
		success: function(data){
			context.trigger('handleLoadRemoteData',{all: data});
		},
		error: function(re,text,error) {
			context.trigger('handleLoadRemoteDataError',{request: re , text: text , error: error});
		}
		});
	})

	this.bind('handleLoadRemoteData', function(e, data) {
		var context =this;
		var temp = JSON.parse(data['all']);
		var count = temp.length -1;
		while (count>-1){
			var t = temp[count];
			if(t.type == 'Cliente__c'){
				clientes.push(t);
			}
			else{
				productos.push(t);
			}
				count--;
		}
		store.set('productos', productos);
		store.set('clientes', clientes);
		context.trigger('loadLocalData');
	});


	this.bind('handleLoadRemoteDataError',function(e,data){
		var context = this;
		alert('Ocurrio un error cargando los datos de Salesforce, puede continuar trabajando fuera de linea. Favor reporte el error si se repite. El codigo es ' + data['request'].status);
		context.trigger('loadLocalData');
	});

	this.bind('loadLocalData', function() {
		var context = this;
		clientes = store.get('clientes');
		productos = store.get('productos');
		opp = store.get('oportunidades');
		oportunidades = new Array();
		if(opp!=null){
			$.each(opp, function(i, item) {
				if(item!=null && item != undefined){
					oportunidades.push(item);
				}
			});
		}

		$.each(clientes, function(i, item) {
			map_clientes[item.Id]=item;
		});

		$.each(productos, function(i, item) {
			map_productos[item.Id]=item;
		});

		context.redirect('#pedido_show/');
	});



	////////////////////////
	////////// DATA SAVING EVENTS

	 this.bind('handleSaveOportunidadesError',function(e,data){
		var context = this;
		var re = data['request'];
		if(re.status='404'){
			alert('No se puedo conectar a internet para enviar los pedidos. Favor revise su conexion.');
		}
		else{
			alert('Error del Tipo ' + re.status + ' :: ' + re.statusText + '. Favor reportelo a su administrador.');
		}
		context.redirect('#pedido_show/');
	});

	//TODO IMPROVE THIS WAY TO HANDLE N AND N+1 RESULTS
	this.bind('hangleSaveOportunidades', function(e, data) {
		var context =this;
		var temp = data['all'];
		o = this.json(temp);
		if(o.Fault!=null){
			alert('Reporte este error al Administrador: ' + temp);
		}
		else{
			results = o.createResponse.result;
			if(results.success=="true"){
				oportunidades.splice(0,1);
			}
			else if(results.success=="false"){
				alert('Resporte este error al Administrador: ' + context.json(results));
			}
			else{
				oportunidades=new Array();
			}
		}
	
		store.set('oportunidades', oportunidades);

		context.redirect('#pedido_show/');
	});

	////////////////////////
	////////// SEARCH EVENTS

	this.bind('doShowClienteSearchResult', function(e, data) {
		var context = this;
		tempclientes = data['results']
		$('#clientesList').html(' ');
		$.each(tempclientes, function(i, item) {
			context.partial('/templates/clienteItem.html.erb', {item: item}, function(html) {
			$('#clientesList').append(html);
		});
		});
	});

	this.bind('doShowProductoSearchResult', function(e, data) {
		var context = this;
		tempproductos = data['results']
		$('#productosList').html(' ');
		$.each(tempproductos, function(i, item) {
			context.partial('/templates/productoItem.html.erb', {item: item}, function(html) {
				$('#productosList').append(html);
			});
		});
	});

	////////////////////////
	////////// APP EVENTS

	this.bind('run', function() {
		var context = this;
		store = new Sammy.Store({name: 'rodco-facturacion', element: 'body', type: 'local'});
		cart = new Sammy.Store({name: 'rodco-cart', element: 'body', type: 'session'});
		$('#txt_username').val(store.get('username'));
		$('#txt_password').val(store.get('password'));
		$('#txt_token').val(store.get('token'));
		context.redirect('#login/');
		});
	});
 
app.run('#/');
});