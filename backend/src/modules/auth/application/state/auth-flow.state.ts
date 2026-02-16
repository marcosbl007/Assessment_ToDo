/**
 * - Máquina de estados simple para flujo de auth (start/validate/persist/complete/fail).
 * - Permite controlar transiciones válidas y estados finales.
 */
interface AuthFlowState {
  name: string;
  start(_context: AuthFlowContext): void;
  validate(_context: AuthFlowContext): void;
  persist(_context: AuthFlowContext): void;
  complete(_context: AuthFlowContext): void;
  fail(_context: AuthFlowContext): void;
}

class IdleState implements AuthFlowState {
  name = 'IDLE';
  /** Inicia flujo y avanza a validación. */
  start(context: AuthFlowContext): void {
    context.setState(new ValidatingState());
  }
  validate(): void { throw new Error('Transición inválida desde IDLE'); }
  persist(): void { throw new Error('Transición inválida desde IDLE'); }
  complete(): void { throw new Error('Transición inválida desde IDLE'); }
  fail(context: AuthFlowContext): void { context.setState(new FailedState()); }
}

class ValidatingState implements AuthFlowState {
  name = 'VALIDATING';
  start(): void { throw new Error('Ya iniciado'); }
  /** Tras validar reglas de entrada avanza a persistencia. */
  validate(context: AuthFlowContext): void { context.setState(new PersistingState()); }
  persist(): void { throw new Error('Debes validar antes de persistir'); }
  complete(): void { throw new Error('No puedes completar sin persistir'); }
  fail(context: AuthFlowContext): void { context.setState(new FailedState()); }
}

class PersistingState implements AuthFlowState {
  name = 'PERSISTING';
  start(): void { throw new Error('Ya iniciado'); }
  validate(): void { throw new Error('Ya validado'); }
  /** Marca persistencia finalizada y cierra en éxito. */
  persist(context: AuthFlowContext): void { context.setState(new SuccessState()); }
  complete(): void { throw new Error('Completa primero persistencia'); }
  fail(context: AuthFlowContext): void { context.setState(new FailedState()); }
}

class SuccessState implements AuthFlowState {
  name = 'SUCCESS';
  start(): void { throw new Error('Flujo ya finalizado'); }
  validate(): void { throw new Error('Flujo ya finalizado'); }
  persist(): void { throw new Error('Flujo ya finalizado'); }
  complete(): void {}
  fail(): void { throw new Error('No puedes fallar un flujo exitoso'); }
}

class FailedState implements AuthFlowState {
  name = 'FAILED';
  start(): void { throw new Error('Flujo en estado fallido'); }
  validate(): void { throw new Error('Flujo en estado fallido'); }
  persist(): void { throw new Error('Flujo en estado fallido'); }
  complete(): void { throw new Error('Flujo en estado fallido'); }
  fail(): void {}
}

export class AuthFlowContext {
  private state: AuthFlowState;

  constructor() {
    this.state = new IdleState();
  }

  /** Cambia explícitamente al siguiente estado interno. */
  setState(nextState: AuthFlowState): void {
    this.state = nextState;
  }

  start(): void { this.state.start(this); }
  validate(): void { this.state.validate(this); }
  persist(): void { this.state.persist(this); }
  complete(): void { this.state.complete(this); }
  fail(): void { this.state.fail(this); }

  /** Nombre legible del estado actual para depuración/trazabilidad. */
  get currentState(): string {
    return this.state.name;
  }
}
