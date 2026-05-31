import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { MobileOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import { deviceService, userService } from '../../services/api';

const { Title, Paragraph, Text } = Typography;

interface AllowedDeviceRow {
  id: string;
  mac: string;
  label?: string | null;
  isActive: boolean;
  userId?: string | null;
  createdAt?: string;
}

const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<AllowedDeviceRow[]>([]);
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const data = await deviceService.getDevices();
      setDevices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      message.error('Не удалось загрузить список устройств (нужна роль admin и обновлённый сервер)');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await userService.getUsers();
      const list = Array.isArray(res?.data) ? res.data : [];
      setUsers(list.map((u: any) => ({ id: u.id, username: u.username })));
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    load();
    loadUsers();
  }, []);

  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await deviceService.createDevice({
        mac: values.mac,
        label: values.label || null,
        userId: values.userId || null,
        isActive: values.isActive !== false,
      });
      message.success('Устройство добавлено');
      setModalOpen(false);
      await load();
    } catch (e: any) {
      const err = e?.response?.data?.error || e?.message || 'Ошибка сохранения';
      message.error(typeof err === 'string' ? err : 'Ошибка сохранения');
    }
  };

  const toggleActive = async (row: AllowedDeviceRow, next: boolean) => {
    try {
      await deviceService.updateDevice(row.id, { isActive: next });
      message.success(next ? 'Устройство активировано' : 'Устройство отключено');
      await load();
    } catch (e: any) {
      const err = e?.response?.data?.error || e?.message;
      message.error(typeof err === 'string' ? err : 'Ошибка обновления');
    }
  };

  const deactivate = (row: AllowedDeviceRow) => {
    Modal.confirm({
      title: 'Отключить устройство?',
      content: `MAC ${row.mac} больше не сможет входить при включённой проверке на сервере.`,
      okText: 'Отключить',
      okType: 'danger',
      cancelText: 'Отмена',
      async onOk() {
        try {
          await deviceService.deleteDevice(row.id);
          message.success('Устройство отключено');
          await load();
        } catch (e: any) {
          const err = e?.response?.data?.error || e?.message;
          message.error(typeof err === 'string' ? err : 'Ошибка');
        }
      },
    });
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>
            <MobileOutlined /> Разрешённые устройства (MAC)
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 8 }}>
            Здесь администратор ведёт белый список MAC. При входе клиент может передать MAC (поле{' '}
            <Text code>deviceMac</Text> в теле запроса логина или заголовок <Text code>X-Device-Mac</Text>
            ). В веб/PWA MAC можно задать вручную: <Text code>localStorage.setItem(&apos;deviceMac&apos;, &apos;AA:BB:…&apos;)</Text> до входа.
          </Paragraph>
          <Alert
            type="info"
            showIcon
            message="Включение блокировки на сервере"
            description={
              <>
                По умолчанию список только хранится. Чтобы запретить вход с чужих устройств, на сервере в
                окружении задайте <Text code>ENFORCE_MAC_WHITELIST=1</Text> и перезапустите API. Сначала
                добавьте MAC всех рабочих телефонов/планшетов, иначе сами себя отрежете.
              </>
            }
          />
        </div>

        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Добавить MAC
          </Button>
          <Button onClick={() => load()} loading={loading}>
            Обновить
          </Button>
        </Space>

        <Table<AllowedDeviceRow>
          rowKey="id"
          loading={loading}
          dataSource={devices}
          pagination={{ pageSize: 15 }}
          columns={[
            { title: 'MAC', dataIndex: 'mac', key: 'mac', width: 160 },
            { title: 'Подпись', dataIndex: 'label', key: 'label', ellipsis: true },
            {
              title: 'Пользователь',
              dataIndex: 'userId',
              key: 'userId',
              width: 140,
              render: (id: string | null) =>
                id ? <Tag color="blue">{id}</Tag> : <Tag>любой</Tag>,
            },
            {
              title: 'Активен',
              dataIndex: 'isActive',
              key: 'isActive',
              width: 110,
              render: (v: boolean, row) => (
                <Switch checked={v} onChange={(checked) => toggleActive(row, checked)} />
              ),
            },
            {
              title: '',
              key: 'actions',
              width: 120,
              render: (_, row) => (
                <Button
                  danger
                  type="link"
                  icon={<StopOutlined />}
                  onClick={() => deactivate(row)}
                >
                  Снять
                </Button>
              ),
            },
          ]}
        />
      </Space>

      <Modal
        title="Новое устройство"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Сохранить"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="mac"
            label="MAC-адрес"
            rules={[{ required: true, message: 'Введите MAC' }]}
            extra="Формат: AA:BB:CC:DD:EE:FF или без двоеточий"
          >
            <Input placeholder="AA:BB:CC:DD:EE:FF" autoComplete="off" />
          </Form.Item>
          <Form.Item name="label" label="Подпись (необязательно)">
            <Input placeholder="Например: планшет бункера" />
          </Form.Item>
          <Form.Item name="userId" label="Привязка к пользователю (необязательно)">
            <Select allowClear placeholder="Любой пользователь с этим MAC" showSearch optionFilterProp="label">
              {users.map((u) => (
                <Select.Option key={u.id} value={u.id} label={u.username}>
                  {u.username}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="Активен" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DeviceManagement;
