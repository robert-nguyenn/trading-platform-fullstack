#!/bin/bash

# EKS Node Bootstrap Script
# Optimized for high-performance trading workloads

# Update system
yum update -y

# Install performance monitoring tools
yum install -y htop iotop sysstat

# Optimize kernel parameters for low latency
cat >> /etc/sysctl.d/99-trading-optimizations.conf << 'EOF'
# Network optimizations for low latency
net.core.rmem_default = 262144
net.core.rmem_max = 16777216
net.core.wmem_default = 262144
net.core.wmem_max = 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr
net.ipv4.tcp_slow_start_after_idle = 0

# Memory optimizations
vm.swappiness = 1
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# CPU optimizations
kernel.sched_min_granularity_ns = 10000000
kernel.sched_wakeup_granularity_ns = 15000000
EOF

# Apply sysctl changes
sysctl -p /etc/sysctl.d/99-trading-optimizations.conf

# Configure CPU governor for performance
echo performance | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Disable CPU frequency scaling
systemctl disable ondemand

# Configure huge pages for better memory performance
echo 1024 > /proc/sys/vm/nr_hugepages
echo 'vm.nr_hugepages = 1024' >> /etc/sysctl.conf

# Install Node Exporter for monitoring
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xzf node_exporter-1.6.1.linux-amd64.tar.gz
cp node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
chown root:root /usr/local/bin/node_exporter

# Create node_exporter service
cat > /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=root
Group=root
Type=simple
ExecStart=/usr/local/bin/node_exporter
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Enable and start node_exporter
systemctl daemon-reload
systemctl enable node_exporter
systemctl start node_exporter

# Bootstrap EKS worker node
/etc/eks/bootstrap.sh ${cluster_name} ${bootstrap_arguments}

# Install additional monitoring and performance tools
yum install -y docker
systemctl enable docker
systemctl start docker

# Configure Docker for performance
cat > /etc/docker/daemon.json << 'EOF'
{
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "exec-opts": ["native.cgroupdriver=systemd"],
  "live-restore": true
}
EOF

systemctl restart docker

# Set up log rotation
cat > /etc/logrotate.d/mercato << 'EOF'
/var/log/mercato/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

# Create performance monitoring script
cat > /usr/local/bin/mercato-performance-monitor.sh << 'EOF'
#!/bin/bash
# Mercato Performance Monitoring Script

LOG_FILE="/var/log/mercato/performance.log"
mkdir -p /var/log/mercato

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
    DISK_USAGE=$(df -h / | awk 'NR==2{printf "%s", $5}')
    NETWORK_RX=$(cat /proc/net/dev | awk '/eth0/ {print $2}')
    NETWORK_TX=$(cat /proc/net/dev | awk '/eth0/ {print $10}')
    
    echo "$TIMESTAMP,CPU:$CPU_USAGE%,MEM:$MEMORY_USAGE%,DISK:$DISK_USAGE,NET_RX:$NETWORK_RX,NET_TX:$NETWORK_TX" >> $LOG_FILE
    
    sleep 30
done
EOF

chmod +x /usr/local/bin/mercato-performance-monitor.sh

# Create systemd service for performance monitoring
cat > /etc/systemd/system/mercato-performance-monitor.service << 'EOF'
[Unit]
Description=Mercato Performance Monitor
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/mercato-performance-monitor.sh
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable mercato-performance-monitor
systemctl start mercato-performance-monitor

echo "EKS node optimization complete"
