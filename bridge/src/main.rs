use std::env;
use std::net::UdpSocket;
use std::sync::{Arc, Mutex};

use rosc::{OscMessage, OscType, OscPacket};
use tokio::net::TcpListener;
use tokio_tungstenite::{accept_async, tungstenite::Message};
use futures_util::StreamExt;

#[tokio::main]
async fn main() {
    println!("Starting DMX to OSC bridge");

    let dmx_universe = env::var("DMX_UNIVERSE").unwrap_or_else(|_| "dmx/universe/0".to_string());
    let host = env::var("OSC_HOST").expect("OSC_HOST environment variable not set");
    let port: u16 = env::var("OSC_PORT").unwrap_or_else(|_| "7770".to_string()).parse().expect("Invalid OSC_PORT");
    let ws_port: u16 = env::var("WS_PORT").unwrap_or_else(|_| "8080".to_string()).parse().expect("Invalid WS_PORT");

    println!("OSC host: {}", host);
    println!("OSC port: {}", port);
    println!("WS port: {}", ws_port);
    println!("DMX universe: {}", dmx_universe);
    
    let dmx_universe_ref = &dmx_universe; // Create a reference to dmx_universe

    let udp_socket = Arc::new(Mutex::new(UdpSocket::bind("0.0.0.0:0").expect("Failed to bind UDP socket")));
    udp_socket.lock().unwrap().connect((host.as_str(), port)).expect("Failed to connect UDP socket");

    let try_socket = TcpListener::bind(format!("0.0.0.0:{}", ws_port)).await;
    let listener = try_socket.expect("Failed to bind WebSocket server");

    while let Ok((stream, _)) = listener.accept().await {
        let ws_stream = accept_async(stream).await.expect("Error during WebSocket handshake");
        let udp_socket = udp_socket.clone();
        let dmx_universe_clone = dmx_universe_ref.to_string();

        let _spawn = tokio::spawn(async move {
            let (_, mut read) = ws_stream.split();
            while let Some(Ok(message)) = read.next().await {
              if let Message::Binary(dmx_raw_data) = message {
                  let mut dmx_data = [0; 512];
                  dmx_data[..dmx_raw_data.len()].copy_from_slice(&dmx_raw_data);
                  //println!("First four DMX values: {:?}", &dmx_raw_data[..4]);
                  
                  for (index, &value) in dmx_data.iter().enumerate() {
                      let addr = format!("/{}/{}", dmx_universe_clone, index + 1);
                      let args = vec![OscType::Int(value as i32)];
                      let var_name = OscMessage {
                          addr,
                          args,
                      };
                      let osc_msg = var_name;
                      let packet: OscPacket = OscPacket::Message(osc_msg);
                      let osc_buffer = rosc::encoder::encode(&packet).expect("Failed to encode OSC message");
                      
                      match udp_socket.lock().unwrap().send(&osc_buffer) {
                          Ok(_) => {
                              //println!("Sent OSC message: {}", to_hex_string(&osc_buffer));
                          },
                          Err(e) => {
                              println!("Failed to send OSC message: {}", e);
                          }
                      }

                  }
              }
            }
          });
    }
}

