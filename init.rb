require 'rubygems'
require 'sinatra'
require 'haml'
require 'ninesixty'
require 'json'
require 'rforce'
require 'net/http'
require 'uri'

enable :sessions

configure(:development) { set :session_secret, "something" }

get '/' do
 haml :index,{:layout => :homeLayout}
end

get '/pedidos' do
     
haml :pedidos
end

get '/corporativo' do
 haml :corporativo
end

get '/enLinea' do
 haml :enLinea
end

get '/catalogo' do
 haml :catalogo
end

get '/contacto' do
 haml :contacto
end

get '/styles' do
 haml :styles
end

get '/login' do

  begin
     Net::HTTP.get 'www.google.com', '/'
     
     #remove # to work remotely
     #return [404, {}, []]
     
  rescue
    return [404, {}, []]
  end
  
  email = params['username']
  password = params['password']
  token = params['token']
  secure = password + token

  session['email'] = email;
  session['secure'] = secure;

  binding = RForce::Binding.new \
      'https://test.salesforce.com/services/Soap/u/21.0'
  
  begin
    binding.login email, secure
 rescue
   return [402, {}, []]
 end
   return [200, {}, []]
end

get '/getdata' do
  ENV['SHOWSOAP'] = 'true'
  
  email = session['email']
  secure = session['secure']
  
   binding = RForce::Binding.new \
      'https://test.salesforce.com/services/Soap/u/21.0'
      
    binding.login \
      email, secure

      records = [];

    answer = binding.query  \
      :queryString =>
        'select name,id,PrecioMinimo__c , Impuesto__c , InventarioActual__c, DescuentoMinimo__c , DescuentoMaximo__c from producto__c'

    records += answer.queryResponse.result.records
         
    answer = binding.query  \
    :queryString =>
      'select name,Id from cliente__c'
            
    records += answer.queryResponse.result.records
    
    return records.to_json
  end

post '/saveOpportunities' do
  ENV['SHOWSOAP'] = 'true'

  begin
      Net::HTTP.get 'www.google.com', '/'

      #remove # to work remotely
      #return [404, {}, []]

   rescue
     return [404, {}, []]
   end

   email = session['email']
   secure = session['secure']
   oportunidades = params['oportunidades']
   
    binding = RForce::Binding.new \
        'https://test.salesforce.com/services/Soap/u/21.0'

      binding.login \
        email, secure
   
  opp = URI.decode(oportunidades)
  opp1 =JSON.parse(opp)
  
         toSave=[]
         opp1.each do |producto|
            
           producto = {
                       :type,'Oportunidad__c',
                       :Cliente__c,    producto['cliente__c'], 
                       :Producto__c,    producto['producto__c'] , 
                       :Precio__c , producto['precio__c'] ,
                       :Cantidad__c, producto['cantidad__c'],
                       :Descuento__c,producto['descuento__c'],
                       :isPedido__c,producto['ispedido__c'],
                       :isOportunidad__c,producto['isoportunidad__c'],
                       :Observacion__c,producto['observacion__c']
                       }
           toSave.push(producto)
         end
       
         upsert = [];
           while toSave.length > 0
              
               #upsert.push(:externalIDFieldName,'CodigoExterno__c');
                
                 upsert.push(:sObject)
                 upsert.push(toSave.pop)
             
             end  

           result =  binding.create upsert
          return  result.to_json
end

 



def render_file(filename)
  contents = File.read('views/'+filename+'.haml')
  Haml::Engine.new(contents).render
end