require 'rubygems'
require 'sinatra'
require 'haml'
require 'ninesixty'
require 'json'

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

def render_file(filename)
  contents = File.read('views/'+filename+'.haml')
  Haml::Engine.new(contents).render
end