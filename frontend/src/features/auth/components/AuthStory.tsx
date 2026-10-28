import { Brand } from '@/shared/branding/Brand';
import { Waves } from 'lucide-react';

export function AuthStory() {
  return (
    <div className="auth-story">
      <Brand />
      <span className="auth-watermark">
        <Waves size={220} strokeWidth={0.5} />
      </span>
      <div>
        <span className="eyebrow">UMA CIDADE MELHOR, JUNTOS.</span>
        <h1>
          O cuidado com Santos
          <br />
          passa por você.
        </h1>
        <p>
          Relate um problema, acompanhe o atendimento e ajude a transformar o lugar onde a gente
          vive.
        </p>
      </div>
      <span className="auth-story-footer">
        <Waves size={19} />
        Santos · São Paulo
      </span>
    </div>
  );
}
