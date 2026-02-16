export type RoleCode = 'STANDARD' | 'SUPERVISOR';

interface RoleNormalizationStrategy {
  canHandle(value: string): boolean;
  resolve(): RoleCode;
}

class StandardRoleStrategy implements RoleNormalizationStrategy {
  canHandle(value: string): boolean {
    return ['usuario estandar', 'standard'].includes(value);
  }

  resolve(): RoleCode {
    return 'STANDARD';
  }
}

class SupervisorRoleStrategy implements RoleNormalizationStrategy {
  canHandle(value: string): boolean {
    return ['usuario supervisor', 'supervisor'].includes(value);
  }

  resolve(): RoleCode {
    return 'SUPERVISOR';
  }
}

export class RoleNormalizationContext {
  private readonly strategies: RoleNormalizationStrategy[];

  constructor() {
    this.strategies = [new StandardRoleStrategy(), new SupervisorRoleStrategy()];
  }

  normalize(inputRole: string): RoleCode {
    const normalized = inputRole
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const strategy = this.strategies.find((candidate) => candidate.canHandle(normalized));
    if (!strategy) {
      throw new Error('Rol inválido. Usa Usuario estándar o Usuario supervisor.');
    }

    return strategy.resolve();
  }
}
