import type { User } from '@/contracts';
import type { ProfileController } from '@/features/profile/hooks/useProfilePage';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { Field } from '@/shared/ui/Field';

type Props = Pick<ProfileController, 'setEditing' | 'busy' | 'save'> & { user: User };

export function EditProfileDialog({ user, setEditing, busy, save }: Props) {
  return (
    <Dialog title="Editar perfil" onClose={() => setEditing(false)}>
      <form className="form-stack" onSubmit={save}>
        <Field label="Nome completo" htmlFor="edit-nome">
          <input id="edit-nome" name="nome" defaultValue={user.nome} required minLength={2} />
        </Field>
        <Field
          label="E-mail da conta"
          htmlFor="edit-email"
          hint="Este endereço identifica seu acesso."
        >
          <input id="edit-email" value={user.email} readOnly />
        </Field>
        <Field label="Telefone" htmlFor="edit-telefone" optional>
          <input id="edit-telefone" name="telefone" type="tel" defaultValue={user.telefone} />
        </Field>
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
          <Button disabled={busy}>{busy ? 'Salvando…' : 'Salvar alterações'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
