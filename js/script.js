const estacionamentoApp = {
  apiBase: 'http://cnms-parking-api.net.uztec.com.br/api/v1',

  async request(path, method = 'GET', body) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(this.apiBase + path, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro desconhecido');
    return data;
  },

  setMessage(selector, message, isError = false) {
    const el = document.querySelector(selector);
    el.textContent = message;
    el.style.color = isError ? 'red' : 'green';
  },

  clearMessage(selector) {
    document.querySelector(selector).textContent = '';
  },

  formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  },

  formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}min`;
  },

  async registerEntry(event) {
    event.preventDefault();
    this.clearMessage('#msgEntry');
    const plate = document.querySelector('#plateEntry').value.trim();
    const model = document.querySelector('#modelEntry').value.trim();

    try {
      const result = await this.request('/entry', 'POST', { plate, model });
      this.setMessage('#msgEntry', result.message || 'Entrada registrada!');
    } catch (error) {
      this.setMessage('#msgEntry', error.message, true);
    }
  },

  async checkVehicle(event) {
    event.preventDefault();
    this.clearMessage('#msgCheck');
    const plate = document.querySelector('#plateCheck').value.trim();

    try {
      const result = await this.request(`/check/${plate}`);
      if (result.error) {
        this.setMessage('#msgCheck', `Veículo NÃO está presente. Mensagem: ${result.error}`, true);
      } else {
        this.setMessage('#msgCheck', `Veículo está presente:\nPlaca: ${result.plate}\nEntrada: ${this.formatDate(result.entryTime)}`);
      }
    } catch (error) {
      this.setMessage('#msgCheck', 'Erro: ' + error.message, true);
    }
  },

  async registerExit(event) {
    event.preventDefault();
    this.clearMessage('#msgExit');
    const plate = document.querySelector('#plateExit').value.trim();

    try {
      const result = await this.request(`/exit/${plate}`, 'PATCH');
      this.setMessage('#msgExit', result.message || 'Saída registrada!');
    } catch (error) {
      this.setMessage('#msgExit', error.message, true);
    }
  },

  async cancelRegistration(event) {
    event.preventDefault();
    this.clearMessage('#msgCancel');
    const plate = document.querySelector('#plateCancel').value.trim();

    try {
      const result = await this.request(`/cancel/${plate}`, 'DELETE');
      this.setMessage('#msgCancel', result.message || 'Registro cancelado!');
    } catch (error) {
      this.setMessage('#msgCancel', error.message, true);
    }
  },

  async getReport() {
    const pre = document.querySelector('#reportResult');
    pre.textContent = 'Carregando...';

    try {
      const data = await this.request('/report');
      pre.textContent = `Relatório do dia: ${data.date}\n` +
                        `Total de Entradas: ${data.totalEntries}\n` +
                        `Total de Saídas: ${data.totalExits}\n` +
                        `Veículos Atuais: ${data.currentVehicles}\n` +
                        `Receita Total: ${data.totalRevenue}\n`;
    } catch (error) {
      pre.textContent = 'Erro ao carregar relatório: ' + error.message;
    }
  },

  async getSlots() {
    const div = document.querySelector('#slotsResult');
    div.textContent = 'Carregando...';

    try {
      const slots = await this.request('/slots');
      const active = await this.request('/active');

      const total = slots.totalSlots ?? 'N/A';
      const occupied = Array.isArray(active) ? active.length : 'N/A';
      const free = (total !== 'N/A' && occupied !== 'N/A') ? total - occupied : 'N/A';

      div.textContent = `Vagas totais: ${total}, Ocupadas: ${occupied}, Livres: ${free}`;
    } catch (error) {
      div.textContent = 'Erro: ' + error.message;
    }
  },

  async getTime(event) {
    event.preventDefault();
    const plate = document.querySelector('#plateTime').value.trim();
    const div = document.querySelector('#timeResult');
    div.textContent = 'Carregando...';

    try {
      const data = await this.request(`/time/${plate}`);

      if (data.error) {
        div.textContent = `Erro: ${data.error}`;
        return;
      }

      if (data.parkedTime === undefined) {
        div.textContent = 'Dados não encontrados para esse veículo.';
        return;
      }

      div.textContent = `Tempo estacionado: ${this.formatDuration(data.parkedTime)}`;
    } catch (error) {
      div.textContent = 'Erro: ' + error.message;
    }
  },

  async getActiveVehicles() {
    const div = document.querySelector('#activeVehicles');
    div.textContent = 'Carregando...';

    try {
      const data = await this.request('/active');
      const vehicles = data.vehicles || data;

      if (!vehicles || vehicles.length === 0) {
        div.textContent = 'Nenhum veículo ativo encontrado.';
        return;
      }

      let text = 'Veículos ativos:\n\n';
      vehicles.forEach(v => {
        text += `Placa: ${v.plate}\nModelo: ${v.model}\nEntrada: ${this.formatDate(v.entryTime)}\n\n`;
      });

      div.textContent = text;
    } catch (error) {
      div.textContent = 'Erro: ' + error.message;
    }
  },

  init() {
    document.querySelector('#formEntry').addEventListener('submit', this.registerEntry.bind(this));
    document.querySelector('#formCheck').addEventListener('submit', this.checkVehicle.bind(this));
    document.querySelector('#formExit').addEventListener('submit', this.registerExit.bind(this));
    document.querySelector('#formCancel').addEventListener('submit', this.cancelRegistration.bind(this));
    document.querySelector('#btnReport').addEventListener('click', this.getReport.bind(this));
    document.querySelector('#btnSlots').addEventListener('click', this.getSlots.bind(this));
    document.querySelector('#formTime').addEventListener('submit', this.getTime.bind(this));
    document.querySelector('#btnActiveVehicles').addEventListener('click', this.getActiveVehicles.bind(this));
  }
};

document.addEventListener('DOMContentLoaded', () => estacionamentoApp.init());


