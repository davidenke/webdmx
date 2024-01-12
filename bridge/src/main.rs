use log::{info, warn, error, LevelFilter};
use std::env;
use std::net::UdpSocket;
use std::sync::{Arc, Mutex};

use rosc::{OscMessage, OscType, OscPacket};
use tokio::net::TcpListener;
use tokio_tungstenite::{accept_async, tungstenite::Message};
use futures_util::StreamExt;

use log4rs::append::file::FileAppender;
use log4rs::encode::pattern::PatternEncoder;
use log4rs::config::{Appender, Config, Root};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>>{
    let logfile = FileAppender::builder()
    .encoder(Box::new(PatternEncoder::new("{l} - {m}\n")))
    .build("dmx-osc-bridge.log")?;

    let config = Config::builder()
      .appender(Appender::builder().build("logfile", Box::new(logfile)))
      .build(Root::builder()
                .appender("logfile")
                .build(LevelFilter::Info))?;

    log4rs::init_config(config)?;


    info!("Starting DMX to OSC bridge");

    let dmx_universe = env::var("DMX_UNIVERSE").unwrap_or_else(|_| "dmx/universe/0".to_string());
    let host = env::var("OSC_HOST").expect("OSC_HOST environment variable not set");
    let port: u16 = env::var("OSC_PORT").unwrap_or_else(|_| "7770".to_string()).parse().expect("Invalid OSC_PORT");
    let ws_port: u16 = env::var("WS_PORT").unwrap_or_else(|_| "8080".to_string()).parse().expect("Invalid WS_PORT");

    info!("OSC host: {}", host);
    info!("OSC port: {}", port);
    info!("WS port: {}", ws_port);
    info!("DMX universe: {}", dmx_universe);
    
    let udp_socket = Arc::new(Mutex::new(UdpSocket::bind("0.0.0.0:0").expect("Failed to bind UDP socket")));
    udp_socket.lock().unwrap().connect((host.as_str(), port)).expect("Failed to connect UDP socket");

    let socket = TcpListener::bind(format!("0.0.0.0:{}", ws_port)).await;
    let listener = socket.expect("Failed to bind WebSocket server");

    while let Ok((tcp_stream, _)) = listener.accept().await {
      match accept_async(tcp_stream).await {
          Ok(ws_stream) => {
            let udp_socket = udp_socket.clone();
            let dmx_universe_clone = dmx_universe.clone();
            
            // process websocket messages
            tokio::spawn(async move {
              let (_, mut read) = ws_stream.split();
              while let Some(Ok(message)) = read.next().await {
                if let Message::Binary(dmx_raw_data) = message {
                    let mut dmx_data = [0; 512];
                    dmx_data[..dmx_raw_data.len()].copy_from_slice(&dmx_raw_data);
                    send_dmx_data(&dmx_data, &udp_socket, &dmx_universe_clone);
                }
              }
            });
          },
          Err(e) => {
              error!("Failed to accept WebSocket connection: {}", e);
              continue;
          }
      }
    }
    Ok(())
}

fn send_dmx_data(dmx_data: &[u8], udp_socket: &Arc<Mutex<UdpSocket>>, dmx_universe: &str) {
    for (index, &value) in dmx_data.iter().enumerate() {
        let addr = format!("/{}/{}", dmx_universe, index + 1);
        let args = vec![OscType::Int(value as i32)];
        let packet: OscPacket = OscPacket::Message(OscMessage {
          addr,
          args,
        });

        match rosc::encoder::encode(&packet) {
            Ok(osc_buffer) => {
                match udp_socket.lock().unwrap().send(&osc_buffer) {
                    Ok(_) => {},
                    Err(e) => {
                        warn!("Failed to send OSC message: {}", e);
                    }
                }
            },
            Err(e) => {
                warn!("Failed to encode OSC message: {}", e);
            }
        }
    }
}