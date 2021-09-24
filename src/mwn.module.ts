import { ClassProvider, DynamicModule, Module, Provider } from "@nestjs/common";
import { mwn } from "mwn";
import {
  MwnModuleAsyncOptions,
  MwnModuleOptions,
  MwnModuleOptionsFactory,
} from "./mwn.interface";
import { MwnConstants } from "./mwn.constants";

@Module({})
export class MwnModule {
  public static forRoot(options: MwnModuleOptions): DynamicModule {
    const providers = this.createProviders(options);

    return {
      module: MwnModule,
      providers: providers,
      exports: providers,
    };
  }

  private static createProviders(options: MwnModuleOptions): Provider[] {
    return [
      {
        provide: MwnConstants.MWN_MODULE_OPTIONS,
        useValue: options,
      },
      {
        provide: MwnConstants.MWN_INSTANCE,
        useFactory: () => new mwn(options),
      },
    ];
  }

  static forRootAsync(options: MwnModuleAsyncOptions): DynamicModule {
    const mwnProvider: Provider = {
      inject: [MwnConstants.MWN_MODULE_OPTIONS],
      provide: MwnConstants.MWN_INSTANCE,
      useFactory: (options: MwnModuleOptions) => new mwn(options),
    };

    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: MwnModule,
      imports: [...(options.imports || [])],
      providers: [mwnProvider, ...asyncProviders],
      exports: [mwnProvider],
    };
  }

  private static createAsyncProviders(
    options: MwnModuleAsyncOptions
  ): Provider[] {
    if (options.useFactory || options.useExisting) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
        inject: [options.inject || []],
      } as ClassProvider,
    ];
  }

  private static createAsyncOptionsProvider(
    options: MwnModuleAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: MwnConstants.MWN_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: MwnConstants.MWN_MODULE_OPTIONS,
      useFactory: async (
        optionsFactory: MwnModuleOptionsFactory
      ): Promise<MwnModuleOptions> => optionsFactory.createMwnModuleOptions(),
      inject: options.useClass ? [options.useClass] : [],
    };
  }
}
