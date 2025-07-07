import React, { useState, useEffect } from 'react';
import { Empty, List, Typography, Tabs } from 'antd';
import { Card } from 'antd';
import { getAuditLog } from '../services/keyService';

const { TabPane } = Tabs;

const AdminSuspiciousActivity: React.FC = () => {
  const [logs, setLogs] = useState<{ msg: string; time: string }[]>([]);

  useEffect(() => {
    setLogs(getAuditLog());
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-3xl font-bold text-gray-800">Giám Sát & Lịch sử</h1>
      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Hành Vi Bất Thường" key="1">
            <Empty description="Tính năng đang được phát triển. Dữ liệu giám sát hành vi bất thường sẽ sớm được cập nhật." />
          </TabPane>
          <TabPane tab="Lịch sử Thao tác (Audit Log)" key="2">
            <List
              dataSource={logs}
              renderItem={(item: { time: string; msg: string }) => (
                <List.Item>
                  <Typography.Text>[{item.time}]</Typography.Text> {item.msg}
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default AdminSuspiciousActivity; 